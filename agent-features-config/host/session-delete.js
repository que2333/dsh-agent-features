import { readdir, rm, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'

const ROUTE = '/session-delete/delete'
const ID_PATTERN = /^[A-Za-z0-9._-]{1,160}$/
const SESSION_FILE = /^session(\..+)?\.jsonl(\.zstd)?$/
const EFFECT_META = Symbol.for('cordis.effect')

/**
 * Host half: permanently remove archived Session logs and tell connected pages.
 * DSH has no session-deletion API (the persistence seam is append-only), so this
 * removes the backend's session directory and projection checkpoint directly and
 * emits the allowlisted `api-session/removed` event to update the browser list.
 */
export const inject = ['webServer', 'workspaceRegistry', 'sessions']

export function apply(ctx) {
  const dshHome = process.env.DSH_HOME ?? path.join(homedir(), '.dsh')
  const persistence = ctx.get('sessionPersistence')
  const sessionsRoot =
    persistence !== undefined && typeof persistence.root === 'string'
      ? persistence.root
      : path.join(dshHome, 'sessions')
  const cacheRoot = path.join(dshHome, 'storages', 'session_projcache', 'sessions')
  const deleting = new Map()

  function archivedIds() {
    const value = ctx.workspaceRegistry?.archivedSessionIds
    return Array.isArray(value) ? value : undefined
  }

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
   * Find the exact lifecycle effect that AgentLoop created for one agent.
   * Invoking it runs DSH's own teardown: cancel, wait for idle, dispose the
   * agent scope, close the persistence write handle, then detach agent/session.
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
    for (let attempt = 0; attempt < 40; attempt += 1) {
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
        new Error(`session-delete: cannot close loaded session "${id}": agent loop lifecycle was not found`),
      )
      return false
    }

    try {
      await dispose()
    } catch (error) {
      ctx.logger.warn(
        new Error(`session-delete: closing session "${id}" failed`, {
          cause: error instanceof Error ? error : new Error(String(error)),
        }),
      )
    }

    // The lifecycle effect normally leaves both registries empty. Do not touch
    // the log unless teardown actually released every writer/ownership edge.
    return waitForReleased(id, agents)
  }

  async function deleteOneUnlocked(id) {
    if (typeof id !== 'string' || !ID_PATTERN.test(id)) return { ok: false, code: 'BAD_ID' }
    const archived = archivedIds()
    if (archived === undefined) return { ok: false, code: 'UNAVAILABLE' }
    if (!archived.includes(id)) return { ok: false, code: 'NOT_ARCHIVED' }
    if (!(await releaseLiveSession(id))) return { ok: false, code: 'BUSY' }
    const dirs = await findSessionDirs(id)
    for (const dir of dirs) await rm(dir, { recursive: true, force: true })
    await rm(path.join(cacheRoot, `${id}.json`), { force: true }).catch(() => {})
    ctx.emit('api-session/removed', id)
    return { ok: true, id, removed: dirs.length }
  }

  function deleteOne(id) {
    const pending = deleting.get(id)
    if (pending !== undefined) return pending
    const task = deleteOneUnlocked(id).finally(() => {
      if (deleting.get(id) === task) deleting.delete(id)
    })
    deleting.set(id, task)
    return task
  }

  async function deleteAll() {
    const archived = archivedIds()
    if (archived === undefined) return { ok: false, code: 'UNAVAILABLE' }
    const removed = []
    const skipped = []
    for (const id of [...archived]) {
      const result = await deleteOne(id)
      if (result.ok) removed.push(id)
      else if (result.code !== 'BAD_ID') skipped.push({ id, code: result.code })
    }
    return { ok: true, removed, skipped }
  }

  async function readJson(req) {
    let size = 0
    const chunks = []
    for await (const chunk of req) {
      size += chunk.length
      if (size > 4096) throw new Error('session-delete: request body too large')
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

  async function handler(req, res) {
    if (req.method !== 'POST') return send(res, 405, { ok: false, code: 'METHOD' })
    if (req.headers['x-dsh-session-delete'] !== '1') {
      return send(res, 403, { ok: false, code: 'FORBIDDEN' })
    }
    const origin = req.headers.origin
    if (!originAllowed(origin)) {
      return send(res, 403, { ok: false, code: 'ORIGIN' })
    }
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
      if (body !== null && typeof body === 'object' && body.all === true) {
        const result = await deleteAll()
        return send(res, result.ok ? 200 : 503, result)
      }
      const result = await deleteOne(body?.sessionId)
      return send(res, result.ok ? 200 : 409, result)
    } catch (error) {
      ctx.logger.warn(error instanceof Error ? error : new Error(String(error)))
      return send(res, 500, { ok: false, code: 'INTERNAL' })
    }
  }

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: ROUTE,
        handler,
      }),
    'session-delete: route',
  )
}
