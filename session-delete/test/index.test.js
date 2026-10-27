import assert from 'node:assert/strict'
import { access, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import test from 'node:test'

import { apply } from '../index.js'

const EFFECT_META = Symbol.for('cordis.effect')
const ORIGIN = 'http://127.0.0.1:43123'

async function exists(target) {
  try {
    await access(target)
    return true
  } catch {
    return false
  }
}

async function fixture({ loaded = true, withLifecycle = true, holdLifecycle = false } = {}) {
  const home = await mkdtemp(path.join(tmpdir(), 'session-delete-'))
  const previousHome = process.env.DSH_HOME
  process.env.DSH_HOME = home
  const sessionId = 'session-test'
  const sessionsRoot = path.join(home, 'sessions')
  const sessionDir = path.join(sessionsRoot, 'project', sessionId)
  const cacheFile = path.join(home, 'storages', 'session_projcache', 'sessions', `${sessionId}.json`)
  await mkdir(sessionDir, { recursive: true })
  await mkdir(path.dirname(cacheFile), { recursive: true })
  await writeFile(path.join(sessionDir, 'session.v4.jsonl.zstd'), 'log')
  await writeFile(cacheFile, '{}')

  const agents = new Map()
  const sessions = new Map()
  const warnings = []
  const events = []
  let lifecycleCalls = 0
  let finishLifecycle
  let route
  if (loaded) {
    agents.set(sessionId, {})
    sessions.set(sessionId, {})
  }

  const release = () => {
    agents.delete(sessionId)
    sessions.delete(sessionId)
    events.push(`session/disposed:${sessionId}`)
  }
  const lifecycle = async () => {
    lifecycleCalls += 1
    if (holdLifecycle) {
      await new Promise((resolve) => {
        finishLifecycle = resolve
      })
    }
    release()
  }
  if (withLifecycle) {
    Object.defineProperty(lifecycle, EFFECT_META, {
      value: { label: `agentLoop.lifecycle(${sessionId})`, children: [] },
    })
  }

  const ctx = {
    registry: {
      values: () => [{ fibers: [{ _disposables: withLifecycle ? [lifecycle] : [] }] }],
    },
    workspaceRegistry: { archivedSessionIds: [sessionId] },
    sessions: { get: (id) => sessions.get(id) },
    get(name) {
      if (name === 'agents') return { get: (id) => agents.get(id) }
      if (name === 'sessionPersistence') return { root: sessionsRoot }
      return undefined
    },
    emit(name, id) {
      events.push(`${name}:${id}`)
    },
    logger: {
      warn(error) {
        warnings.push(error)
      },
    },
    effect(callback) {
      callback()
      return () => {}
    },
    webServer: {
      register(config) {
        route = config.handler
        return () => {}
      },
      getOrigin() {
        return ORIGIN
      },
    },
  }

  apply(ctx)
  return {
    home,
    sessionId,
    sessionDir,
    cacheFile,
    agents,
    sessions,
    warnings,
    events,
    lifecycleCalls: () => lifecycleCalls,
    finishLifecycle: () => finishLifecycle(),
    request: (body) => request(route, body),
    async cleanup() {
      if (previousHome === undefined) delete process.env.DSH_HOME
      else process.env.DSH_HOME = previousHome
      await rm(home, { recursive: true, force: true })
    },
  }
}

async function request(route, body) {
  const req = Readable.from([Buffer.from(JSON.stringify(body))])
  req.method = 'POST'
  req.headers = {
    'content-type': 'application/json',
    'x-dsh-session-delete': '1',
  }
  const result = { status: 0, body: '' }
  const res = {
    writeHead(status) {
      result.status = status
    },
    end(body) {
      result.body = body
    },
  }
  await route(req, res)
  return { status: result.status, body: JSON.parse(result.body) }
}

test('closes a loaded session through its lifecycle before deleting files', async (t) => {
  const value = await fixture()
  t.after(() => value.cleanup())
  const response = await value.request({ sessionId: value.sessionId })

  assert.equal(response.status, 200)
  assert.equal(response.body.ok, true)
  assert.equal(value.lifecycleCalls(), 1)
  assert.equal(value.agents.has(value.sessionId), false)
  assert.equal(value.sessions.has(value.sessionId), false)
  assert.equal(await exists(value.sessionDir), false)
  assert.equal(await exists(value.cacheFile), false)
  assert.equal(value.warnings.length, 0)
  assert(value.events.includes(`session/disposed:${value.sessionId}`))
  assert(value.events.includes(`api-session/removed:${value.sessionId}`))
})

test('does not touch files when the lifecycle teardown fails to release the session', async (t) => {
  const value = await fixture({ withLifecycle: false })
  t.after(() => value.cleanup())
  const response = await value.request({ sessionId: value.sessionId })

  assert.equal(response.status, 409)
  assert.deepEqual(response.body, { ok: false, code: 'BUSY' })
  assert.equal(value.lifecycleCalls(), 0)
  assert.equal(value.agents.has(value.sessionId), true)
  assert.equal(value.sessions.has(value.sessionId), true)
  assert.equal(await exists(value.sessionDir), true)
  assert.equal(await exists(value.cacheFile), true)
  assert.equal(value.warnings.length, 1)
})

test('waits for lifecycle teardown before deleting files', async (t) => {
  const value = await fixture({ holdLifecycle: true })
  t.after(() => value.cleanup())
  let settled = false
  const pending = value.request({ sessionId: value.sessionId }).then((response) => {
    settled = true
    return response
  })

  while (value.lifecycleCalls() === 0) {
    await new Promise((resolve) => setTimeout(resolve, 5))
  }
  assert.equal(settled, false)
  assert.equal(await exists(value.sessionDir), true)
  assert.equal(await exists(value.cacheFile), true)

  value.finishLifecycle()
  const response = await pending
  assert.equal(response.status, 200)
  assert.equal(await exists(value.sessionDir), false)
  assert.equal(await exists(value.cacheFile), false)
})

test('deletes an unloaded session without invoking lifecycle teardown', async (t) => {
  const value = await fixture({ loaded: false })
  t.after(() => value.cleanup())
  const response = await value.request({ sessionId: value.sessionId })

  assert.equal(response.status, 200)
  assert.equal(response.body.ok, true)
  assert.equal(value.lifecycleCalls(), 0)
  assert.equal(await exists(value.sessionDir), false)
  assert.equal(await exists(value.cacheFile), false)
})

test('delete-all closes loaded sessions instead of skipping them', async (t) => {
  const value = await fixture()
  t.after(() => value.cleanup())
  const response = await value.request({ all: true })

  assert.equal(response.status, 200)
  assert.deepEqual(response.body.removed, [value.sessionId])
  assert.deepEqual(response.body.skipped, [])
  assert.equal(value.lifecycleCalls(), 1)
  assert.equal(await exists(value.sessionDir), false)
})
