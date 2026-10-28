import { randomUUID } from 'node:crypto'
import { readdir, rename, rm, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'

const ROUTE = '/edit-message/rewrite'
const ID_PATTERN = /^[A-Za-z0-9._-]{1,160}$/
const SESSION_FILE = /^session(\..+)?\.jsonl(\.zstd)?$/
const EFFECT_META = Symbol.for('cordis.effect')
const MAX_BODY_BYTES = 2 * 1024 * 1024
const MESSAGE_TIMEOUT_MS = 10000

class RewriteFailure extends Error {
  constructor(code, message, options) {
    super(message, options)
    this.code = code
  }
}

/**
 * Host half: rewind one user message in the same durable Session.
 *
 * DSH exposes no truncate/revert command. This plugin therefore performs the
 * same logical operation at the persistence boundary: stop the live Agent,
 * back up the JSONL directory, rebuild the exact prefix before the target
 * turn, resume the same session id, and enqueue the edited message with its
 * original durable attachments. A failure restores the backup before the
 * request returns.
 */
export const inject = ['webServer', 'sessions', 'sessionController', 'remoteAccess']

export function apply(ctx) {
  const dshHome = process.env.DSH_HOME ?? path.join(homedir(), '.dsh')
  const persistence = ctx.get('sessionPersistence')
  const sessionsRoot =
    persistence !== undefined && typeof persistence.root === 'string'
      ? persistence.root
      : path.join(dshHome, 'sessions')
  const cacheRoot = path.join(dshHome, 'storages', 'session_projcache', 'sessions')
  const rewrites = new Map()

  async function findSessionDirs(id) {
    let projects
    try {
      projects = await readdir(sessionsRoot, { withFileTypes: true })
    } catch {
      return []
    }
    const dirs = []
    for (const project of projects) {
      if (!project.isDirectory()) continue
      const candidate = path.join(sessionsRoot, project.name, id)
      const info = await stat(candidate).catch(() => null)
      if (info === null || !info.isDirectory()) continue
      const files = await readdir(candidate).catch(() => [])
      if (files.some((name) => SESSION_FILE.test(name))) dirs.push(candidate)
    }
    return dirs
  }

  /**
   * Find the lifecycle effect AgentLoop created for one agent. Invoking it uses
   * DSH's own teardown order: cancel, wait for idle, dispose the Agent scope,
   * close the persistence handle, then detach Agent and Session.
   */
  function findLifecycleDisposer(id) {
    const label = `agentLoop.lifecycle(${id})`
    for (const runtime of ctx.registry.values()) {
      for (const fiber of runtime.fibers ?? []) {
        for (const dispose of fiber?._disposables ?? []) {
          if (typeof dispose !== 'function') continue
          if (dispose[EFFECT_META]?.label === label) return dispose
        }
      }
    }
    return undefined
  }

  async function waitForReleased(id, agents) {
    const released = () => agents?.get(id) === undefined && ctx.sessions.get(id) === undefined
    if (released()) return true
    for (let attempt = 0; attempt < 80; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 50))
      if (released()) return true
    }
    return false
  }

  async function releaseLiveSession(id) {
    const agents = ctx.get('agents')
    const agent = agents?.get(id)
    const session = ctx.sessions.get(id)
    if (agent === undefined && session === undefined) return true

    const dispose = findLifecycleDisposer(id)
    if (dispose === undefined) {
      ctx.logger.warn(
        new Error(`edit-message: cannot close loaded session "${id}": agent loop lifecycle was not found`),
      )
      return false
    }

    try {
      await dispose()
    } catch (error) {
      ctx.logger.warn(
        new Error(`edit-message: closing session "${id}" failed`, {
          cause: error instanceof Error ? error : new Error(String(error)),
        }),
      )
    }
    return waitForReleased(id, agents)
  }

  async function resumeQuietly(id) {
    try {
      const found = await ctx.sessionController.resolveAgent(id)
      if (found?.error !== undefined) {
        ctx.logger.warn(new Error(`edit-message: could not resume session "${id}": ${found.error.message}`))
      }
    } catch (error) {
      ctx.logger.warn(
        new Error(`edit-message: could not resume session "${id}"`, {
          cause: error instanceof Error ? error : new Error(String(error)),
        }),
      )
    }
  }

  async function clearProjectionCache(id) {
    const cache = ctx.get('sessionProjectionCache')
    if (cache?.table?.delete !== undefined) {
      try {
        await cache.table.delete(id)
      } catch (error) {
        ctx.logger.warn(
          new Error(`edit-message: clearing projection cache for "${id}" failed`, {
            cause: error instanceof Error ? error : new Error(String(error)),
          }),
        )
      }
    }
    await rm(path.join(cacheRoot, `${id}.json`), { force: true }).catch(() => {})
  }

  async function removeSessionDirs(id) {
    const dirs = await findSessionDirs(id)
    for (const dir of dirs) await rm(dir, { recursive: true, force: true })
  }

  async function restoreBackups(backups) {
    const failures = []
    for (const { original, backup } of backups) {
      try {
        await rm(original, { recursive: true, force: true })
        await rename(backup, original)
      } catch (error) {
        failures.push(error instanceof Error ? error : new Error(String(error)))
      }
    }
    if (failures.length === 1) throw failures[0]
    if (failures.length > 1) throw new AggregateError(failures, 'edit-message: restoring session backup failed')
  }

  async function backupSessionDirs(id) {
    const dirs = await findSessionDirs(id)
    if (dirs.length === 0) throw new RewriteFailure('NO_LOG', `session "${id}" has no persisted log`)

    const token = randomUUID()
    const backups = []
    try {
      for (const [index, original] of dirs.entries()) {
        const backup = `${original}.edit-message-backup-${token}-${index}`
        await rename(original, backup)
        backups.push({ original, backup })
      }
      return backups
    } catch (error) {
      await restoreBackups(backups).catch((restoreError) => {
        ctx.logger.warn(
          new Error(`edit-message: partial backup restore failed for "${id}"`, {
            cause: restoreError instanceof Error ? restoreError : new Error(String(restoreError)),
          }),
        )
      })
      throw error
    }
  }

  function planRewrite(events, userSeq, expected) {
    const targetIndex = events.findIndex((event) => event.seq === userSeq)
    if (targetIndex < 0) throw new RewriteFailure('STALE', `message seq ${userSeq} was not found`)
    const target = events[targetIndex]
    if (
      target.type !== 'user/message' ||
      target.surfaceOp !== 'append' ||
      target.data?.source?.kind !== 'user'
    ) {
      throw new RewriteFailure('STALE', `event ${userSeq} is not an editable user message`)
    }
    if (expected.messageId !== undefined && target.data?.id !== expected.messageId) {
      throw new RewriteFailure('STALE', `message seq ${userSeq} identity changed`)
    }
    if (expected.messageRpcId !== undefined && target.data?.source?.rpcId !== expected.messageRpcId) {
      throw new RewriteFailure('STALE', `message seq ${userSeq} request identity changed`)
    }

    let turnStartIndex
    for (let index = 0; index <= targetIndex; index += 1) {
      const event = events[index]
      if (event.type === 'turn/end') turnStartIndex = undefined
      else if (event.type === 'turn/start') turnStartIndex = index
    }
    if (turnStartIndex === undefined) {
      throw new RewriteFailure('STALE', `user message ${userSeq} has no containing turn`)
    }

    return {
      cutSeq: events[turnStartIndex].seq,
      prefix: events.slice(0, turnStartIndex),
      message: target.data,
    }
  }

  function inboxLaneLength(events, target) {
    let length = 0
    for (const event of events) {
      if (event.type !== 'agent/inbox/spliced' || event.data?.target !== target) continue
      const data = event.data
      const start = Math.min(Math.max(Number.isSafeInteger(data.start) ? data.start : 0, 0), length)
      const removed = Math.min(
        Math.max(Number.isSafeInteger(data.removedCount) ? data.removedCount : 0, 0),
        length - start,
      )
      const inserted = Array.isArray(data.inserted) ? data.inserted.length : 0
      length = length - removed + inserted
    }
    return length
  }

  function clearPendingInbox(prefix) {
    const nextStep = inboxLaneLength(prefix, 'next-step')
    const nextTurn = inboxLaneLength(prefix, 'next-turn')
    if (nextStep === 0 && nextTurn === 0) return prefix

    const events = [...prefix]
    let seq = (events.at(-1)?.seq ?? -1) + 1
    const time = Date.now()
    if (nextStep > 0) {
      events.push({
        type: 'agent/inbox/spliced',
        seq,
        time,
        data: { target: 'next-step', start: 0, removedCount: nextStep, inserted: [] },
      })
      seq += 1
    }
    if (nextTurn > 0) {
      events.push({
        type: 'agent/inbox/spliced',
        seq,
        time,
        data: { target: 'next-turn', start: 0, removedCount: nextTurn, inserted: [] },
      })
    }
    return events
  }

  function replaceMessageText(content, text) {
    if (!Array.isArray(content)) return [{ type: 'text', text }]
    const next = []
    let replaced = false
    for (const block of content) {
      if (block !== null && typeof block === 'object' && block.type === 'text') {
        if (!replaced) {
          next.push({ ...block, text })
          replaced = true
        }
        continue
      }
      next.push(block)
    }
    if (!replaced) next.unshift({ type: 'text', text })
    return next
  }

  function optionalIdentity(value) {
    if (value === undefined) return undefined
    if (typeof value !== 'string' || value.length === 0 || value.length > 200) return null
    return value
  }

  function canonicalTimeZone(value) {
    if (value === undefined) return undefined
    if (typeof value !== 'string' || value.length === 0 || value.length > 100) return null
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: value }).format(0)
      return value
    } catch {
      return null
    }
  }

  async function writeRewoundLog(meta, inheritedEventCount, prefix) {
    let handle
    try {
      handle = await persistence.create(
        meta,
        { inheritedEventCount: Math.min(inheritedEventCount, prefix.length) },
      )
      if (prefix.length > 0) await handle.append(prefix)
      await handle.flush()
    } finally {
      await handle?.close()
    }
  }

  function waitForMessageAcceptance(id, rpcId) {
    let cancelWait
    const promise = new Promise((resolve, reject) => {
      let settled = false
      let dispose
      let timer

      const finish = (callback, value) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        if (typeof dispose === 'function') dispose()
        else dispose?.dispose?.()
        callback(value)
      }

      dispose = ctx.on(
        'session/event',
        (session, event) => {
          if (session.id !== id) return
          if (event.type === 'agent/inbox/spliced') {
            if (event.data?.target !== 'next-turn') return
            const inserted = Array.isArray(event.data.inserted) ? event.data.inserted : []
            if (inserted.some((message) => message?.source?.kind === 'user' && message.source.rpcId === rpcId)) {
              finish(resolve, event)
            }
            return
          }
          if (event.type === 'user/message') {
            const source = event.data?.source
            if (source?.kind === 'user' && source.rpcId === rpcId) finish(resolve, event)
          }
        },
        { global: true },
      )
      timer = setTimeout(() => {
        finish(reject, new RewriteFailure('ACCEPT_TIMEOUT', `edited message was not logged for "${id}"`))
      }, MESSAGE_TIMEOUT_MS)
      cancelWait = () => finish(() => {}, undefined)
    })
    return {
      promise,
      cancel() {
        cancelWait?.()
      },
    }
  }

  async function rollbackRewrite(id, backups) {
    await releaseLiveSession(id)
    await clearProjectionCache(id)
    await removeSessionDirs(id)
    await restoreBackups(backups)
    await clearProjectionCache(id)
    await resumeQuietly(id)
  }

  async function rewriteUnlocked(body) {
    const id = body.sessionId
    const userSeq = body.userSeq
    const text = body.text
    const clientTimeZone = canonicalTimeZone(body.clientTimeZone)
    const messageId = optionalIdentity(body.messageId)
    const messageRpcId = optionalIdentity(body.messageRpcId)
    if (typeof id !== 'string' || !ID_PATTERN.test(id)) throw new RewriteFailure('BAD_ID', 'invalid session id')
    if (!Number.isSafeInteger(userSeq) || userSeq < 0) {
      throw new RewriteFailure('BAD_SEQ', 'invalid message sequence')
    }
    if (typeof text !== 'string' || text.trim() === '' || text.length > MAX_BODY_BYTES) {
      throw new RewriteFailure('BAD_TEXT', 'edited text is empty or too large')
    }
    if (clientTimeZone === null) throw new RewriteFailure('BAD_TIME_ZONE', 'invalid client time zone')
    if (messageId === null || messageRpcId === null) {
      throw new RewriteFailure('BAD_ID', 'invalid message identity')
    }
    if (persistence === undefined) throw new RewriteFailure('UNAVAILABLE', 'session persistence is unavailable')
    if (ctx.remoteAccess !== undefined && !ctx.remoteAccess.allows({ kind: 'session', id })) {
      throw new RewriteFailure('FORBIDDEN', 'session access denied')
    }

    let inspected
    try {
      inspected = await ctx.sessionController.inspect(id)
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      throw new RewriteFailure('NOT_FOUND', `session "${id}" was not found: ${reason}`, { cause: error })
    }
    planRewrite(inspected.events, userSeq, { messageId, messageRpcId })

    if (!(await releaseLiveSession(id))) throw new RewriteFailure('BUSY', `session "${id}" is busy`)

    let backups = null
    try {
      const current = await ctx.sessionController.inspect(id)
      const plan = planRewrite(current.events, userSeq, { messageId, messageRpcId })
      backups = await backupSessionDirs(id)
      await clearProjectionCache(id)
      await writeRewoundLog(current.meta, current.inheritedEventCount, clearPendingInbox(plan.prefix))

      const found = await ctx.sessionController.resolveAgent(id)
      if (found?.error !== undefined) {
        throw new RewriteFailure('RESUME_FAILED', `session "${id}" could not resume`, {
          cause: found.error,
        })
      }

      const oldSource = plan.message.source
      const rpcId = randomUUID()
      const message = {
        id: randomUUID(),
        role: 'user',
        content: replaceMessageText(plan.message.content, text),
        source: {
          kind: 'user',
          rpcId,
          ...(clientTimeZone === undefined ? {} : { clientTimeZone }),
          ...(oldSource?.principal === undefined ? {} : { principal: oldSource.principal }),
        },
      }
      const accepted = waitForMessageAcceptance(id, rpcId)
      try {
        found.agent.followup(message)
        await accepted.promise
      } catch (error) {
        accepted.cancel()
        throw error
      }
      await persistence.flush()

      for (const { backup } of backups) {
        await rm(backup, { recursive: true, force: true }).catch((error) => {
          ctx.logger.warn(
            new Error(`edit-message: could not remove backup "${backup}"`, {
              cause: error instanceof Error ? error : new Error(String(error)),
            }),
          )
        })
      }
      return { ok: true, sessionId: id }
    } catch (error) {
      if (backups !== null) {
        try {
          await rollbackRewrite(id, backups)
        } catch (rollbackError) {
          ctx.logger.warn(
            new Error(`edit-message: rollback failed for "${id}"; backup retained`, {
              cause: rollbackError instanceof Error ? rollbackError : new Error(String(rollbackError)),
            }),
          )
          throw new RewriteFailure('RECOVERY', `session "${id}" rollback failed`, {
            cause: rollbackError,
          })
        }
      } else {
        await resumeQuietly(id)
      }
      throw error
    }
  }

  function rewrite(body) {
    const id = body?.sessionId
    if (typeof id === 'string' && rewrites.has(id)) {
      return Promise.reject(new RewriteFailure('BUSY', `session "${id}" is already being edited`))
    }
    const task = rewriteUnlocked(body).finally(() => {
      if (rewrites.get(id) === task) rewrites.delete(id)
    })
    if (typeof id === 'string') rewrites.set(id, task)
    return task
  }

  async function readJson(req) {
    let size = 0
    const chunks = []
    for await (const chunk of req) {
      size += chunk.length
      if (size > MAX_BODY_BYTES) throw new Error('edit-message: request body too large')
      chunks.push(chunk)
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  }

  function send(res, status, body) {
    res.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    })
    res.end(JSON.stringify(body))
  }

  function originAllowed(origin) {
    if (origin === undefined) return true
    let url
    try {
      url = new URL(origin)
    } catch {
      return false
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
    const loopback =
      url.hostname === '127.0.0.1' ||
      url.hostname === 'localhost' ||
      url.hostname === '[::1]' ||
      url.hostname === '::1'
    if (!loopback) return false
    let server
    try {
      server = new URL(ctx.webServer.getOrigin())
    } catch {
      return false
    }
    return url.port === server.port
  }

  function failureStatus(code) {
    if (code === 'NOT_FOUND' || code === 'NO_LOG') return 404
    if (code === 'FORBIDDEN') return 403
    if (code === 'BUSY') return 409
    if (
      code === 'STALE' ||
      code === 'BAD_ID' ||
      code === 'BAD_SEQ' ||
      code === 'BAD_TEXT' ||
      code === 'BAD_TIME_ZONE'
    ) {
      return 400
    }
    if (code === 'UNAVAILABLE') return 503
    return 500
  }

  async function handler(req, res) {
    if (req.method !== 'POST') return send(res, 405, { ok: false, code: 'METHOD' })
    if (req.headers['x-dsh-edit-message'] !== '1') {
      return send(res, 403, { ok: false, code: 'FORBIDDEN' })
    }
    if (!originAllowed(req.headers.origin)) return send(res, 403, { ok: false, code: 'ORIGIN' })
    if (!String(req.headers['content-type'] ?? '').includes('application/json')) {
      return send(res, 415, { ok: false, code: 'CONTENT_TYPE' })
    }

    let body
    try {
      body = await readJson(req)
    } catch {
      return send(res, 400, { ok: false, code: 'BODY' })
    }

    try {
      const result = await rewrite(body)
      return send(res, 200, result)
    } catch (error) {
      if (error instanceof RewriteFailure) {
        return send(res, failureStatus(error.code), {
          ok: false,
          code: error.code,
        })
      }
      ctx.logger.warn(error instanceof Error ? error : new Error(String(error)))
      return send(res, 500, {
        ok: false,
        code: 'INTERNAL',
      })
    }
  }

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: ROUTE,
        handler,
      }),
    'edit-message: rewrite route',
  )
}
