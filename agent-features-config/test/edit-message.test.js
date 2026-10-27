import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import test from 'node:test'

import { apply } from '../host/edit-message.js'

const SESSION_ID = 'session-edit-message-test'
const PROJECT_DIR = '--test-project--'
const INITIAL_EVENTS = [
  { type: 'turn/start', seq: 0, time: 1, data: { turn: 1 } },
  {
    type: 'user/message',
    seq: 1,
    time: 2,
    data: {
      id: 'old-1',
      role: 'user',
      content: [{ type: 'text', text: 'first' }],
      source: { kind: 'user', rpcId: 'rpc-1' },
    },
    surfaceOp: 'append',
  },
  { type: 'turn/end', seq: 2, time: 3, data: { turn: 1 } },
  { type: 'turn/start', seq: 3, time: 4, data: { turn: 2 } },
  {
    type: 'user/message',
    seq: 4,
    time: 5,
    data: {
      id: 'old-2',
      role: 'user',
      content: [
        { type: 'text', text: 'second' },
        { type: 'image', attachment: { attachmentId: 'attachment-1' } },
      ],
      source: { kind: 'user', rpcId: 'rpc-2' },
    },
    surfaceOp: 'append',
  },
  { type: 'turn/end', seq: 5, time: 6, data: { turn: 2 } },
]

const QUEUED_EVENTS = [
  { type: 'turn/start', seq: 0, time: 1, data: { turn: 1 } },
  {
    type: 'user/message',
    seq: 1,
    time: 2,
    data: {
      id: 'queued-1',
      role: 'user',
      content: [{ type: 'text', text: 'first' }],
      source: { kind: 'user', rpcId: 'rpc-queued-1' },
    },
    surfaceOp: 'append',
  },
  { type: 'turn/end', seq: 2, time: 3, data: { turn: 1 } },
  {
    type: 'agent/inbox/spliced',
    seq: 3,
    time: 4,
    data: {
      target: 'next-turn',
      start: 0,
      inserted: [
        {
          id: 'queued-2',
          role: 'user',
          content: [{ type: 'text', text: 'queued original' }],
          source: { kind: 'user', rpcId: 'rpc-queued-2' },
        },
      ],
    },
  },
  { type: 'turn/start', seq: 4, time: 5, data: { turn: 2 } },
  {
    type: 'agent/inbox/spliced',
    seq: 5,
    time: 6,
    data: { target: 'next-turn', start: 0, removedCount: 1, inserted: [] },
  },
  { type: 'step/start', seq: 6, time: 7, data: { turn: 2, step: 1 } },
  {
    type: 'user/message',
    seq: 7,
    time: 8,
    data: {
      id: 'queued-2',
      role: 'user',
      content: [{ type: 'text', text: 'queued original' }],
      source: { kind: 'user', rpcId: 'rpc-queued-2' },
    },
    surfaceOp: 'append',
  },
  { type: 'turn/end', seq: 8, time: 9, data: { turn: 2 } },
]

async function makeHarness({
  followupFails = false,
  followupSync = false,
  events = INITIAL_EVENTS,
} = {}) {
  const home = await mkdtemp(path.join(tmpdir(), 'edit-message-test-'))
  const sessionsRoot = path.join(home, 'sessions')
  const sessionDir = path.join(sessionsRoot, PROJECT_DIR, SESSION_ID)
  const logPath = path.join(sessionDir, 'session.v4.jsonl.zstd')
  await mkdir(sessionDir, { recursive: true })
  await writeFile(logPath, 'original-log')

  const listeners = new Set()
  const agents = new Map()
  let createdHeader
  let followed
  let appendedEvents
  let route
  let cacheDeletes = 0

  const persistence = {
    root: sessionsRoot,
    async create(header) {
      createdHeader = header
      await mkdir(sessionDir, { recursive: true })
      await writeFile(logPath, 'rewritten-log')
      return {
        async append(events) {
          appendedEvents = events
        },
        async flush() {},
        async close() {},
      }
    },
    async flush() {},
  }

  const session = { id: SESSION_ID }
  const sessionController = {
    async inspect() {
      return {
        meta: {
          type: 'session',
          version: 4,
          id: SESSION_ID,
          createdAt: 1,
          cwd: path.join(home, 'project'),
          isSeeded: false,
        },
        inheritedEventCount: 0,
        events,
      }
    },
    async resolveAgent() {
      const agent = {
        id: SESSION_ID,
        followup(message) {
          followed = message
          if (followupFails) throw new Error('followup failed')
          const emit = () => {
            for (const listener of listeners) {
              listener(session, {
                ...(followupSync
                  ? {
                      type: 'agent/inbox/spliced',
                      data: { target: 'next-turn', start: 0, inserted: [message] },
                    }
                  : {
                      type: 'user/message',
                      data: {
                        ...message,
                        source: { ...message.source, rpcId: message.source.rpcId },
                      },
                    }),
              })
            }
          }
          if (followupSync) emit()
          else queueMicrotask(emit)
        },
      }
      agents.set(SESSION_ID, agent)
      return { agent }
    },
  }

  const ctx = {
    registry: new Map(),
    remoteAccess: { allows: () => true },
    logger: { warn() {} },
    sessions: { get: () => undefined },
    sessionController,
    webServer: {
      getOrigin: () => 'http://127.0.0.1:59939',
      register(definition) {
        route = definition
        return () => {}
      },
    },
    effect(effect) {
      effect()
      return () => {}
    },
    get(name) {
      if (name === 'sessionPersistence') return persistence
      if (name === 'agents') return agents
      if (name === 'sessionProjectionCache') {
        return {
          table: {
            async delete() {
              cacheDeletes += 1
              return true
            },
          },
        }
      }
      return undefined
    },
    on(_name, listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }

  apply(ctx)

  async function request(body) {
    const req = Readable.from([Buffer.from(JSON.stringify(body))])
    req.method = 'POST'
    req.headers = {
      'content-type': 'application/json',
      'x-dsh-edit-message': '1',
      origin: 'http://127.0.0.1:59939',
    }
    let status = 0
    let responseBody
    const res = {
      writeHead(nextStatus) {
        status = nextStatus
      },
      end(value) {
        responseBody = JSON.parse(value)
      },
    }
    await route.handler(req, res)
    return { status, body: responseBody }
  }

  return {
    request,
    home,
    sessionDir,
    logPath,
    get createdHeader() {
      return createdHeader
    },
    get followed() {
      return followed
    },
    get appendedEvents() {
      return appendedEvents
    },
    get cacheDeletes() {
      return cacheDeletes
    },
    async cleanup() {
      await rm(home, { recursive: true, force: true })
    },
  }
}

test('rewinds the containing turn and resends with the original attachment', async () => {
  const harness = await makeHarness()
  try {
    const response = await harness.request({
      sessionId: SESSION_ID,
      userSeq: 4,
      messageId: 'old-2',
      messageRpcId: 'rpc-2',
      text: 'edited second',
      clientTimeZone: 'Asia/Shanghai',
    })

    assert.equal(response.status, 200)
    assert.deepEqual(response.body, { ok: true, sessionId: SESSION_ID })
    assert.equal(harness.createdHeader.createdAt, 1)
    assert.deepEqual(harness.appendedEvents, INITIAL_EVENTS.slice(0, 3))
    assert.equal(harness.followed.content[0].text, 'edited second')
    assert.deepEqual(harness.followed.content[1], {
      type: 'image',
      attachment: { attachmentId: 'attachment-1' },
    })
    assert.equal(harness.followed.source.kind, 'user')
    assert.equal(await readFile(harness.logPath, 'utf8'), 'rewritten-log')
    assert.ok(harness.cacheDeletes >= 1)
  } finally {
    await harness.cleanup()
  }
})

test('restores the original log when resend fails', async () => {
  const harness = await makeHarness({ followupFails: true })
  try {
    const response = await harness.request({
      sessionId: SESSION_ID,
      userSeq: 4,
      messageId: 'old-2',
      messageRpcId: 'rpc-2',
      text: 'edited second',
    })

    assert.equal(response.status, 500)
    assert.deepEqual(response.body, { ok: false, code: 'INTERNAL' })
    assert.equal(await readFile(harness.logPath, 'utf8'), 'original-log')
  } finally {
    await harness.cleanup()
  }
})

test('accepts a message that is durably queued synchronously', async () => {
  const harness = await makeHarness({ followupSync: true })
  try {
    const response = await harness.request({
      sessionId: SESSION_ID,
      userSeq: 4,
      messageId: 'old-2',
      messageRpcId: 'rpc-2',
      text: 'edited second',
    })

    assert.equal(response.status, 200)
    assert.deepEqual(response.body, { ok: true, sessionId: SESSION_ID })
    assert.equal(harness.followed.content[0].text, 'edited second')
  } finally {
    await harness.cleanup()
  }
})

test('removes the old queued inbox message before turn/start', async () => {
  const harness = await makeHarness({ events: QUEUED_EVENTS, followupSync: true })
  try {
    const response = await harness.request({
      sessionId: SESSION_ID,
      userSeq: 7,
      messageId: 'queued-2',
      messageRpcId: 'rpc-queued-2',
      text: 'edited queued message',
    })

    assert.equal(response.status, 200)
    assert.deepEqual(harness.appendedEvents.slice(0, 4), QUEUED_EVENTS.slice(0, 4))
    assert.deepEqual(harness.appendedEvents.at(-1).data, {
      target: 'next-turn',
      start: 0,
      removedCount: 1,
      inserted: [],
    })
    assert.equal(harness.followed.content[0].text, 'edited queued message')
  } finally {
    await harness.cleanup()
  }
})

test('rejects a stale message identity before changing the session', async () => {
  const harness = await makeHarness()
  try {
    const response = await harness.request({
      sessionId: SESSION_ID,
      userSeq: 4,
      messageId: 'different-message',
      messageRpcId: 'rpc-2',
      text: 'edited second',
    })

    assert.equal(response.status, 400)
    assert.deepEqual(response.body, { ok: false, code: 'STALE' })
    assert.equal(harness.followed, undefined)
    assert.equal(await readFile(harness.logPath, 'utf8'), 'original-log')
  } finally {
    await harness.cleanup()
  }
})
