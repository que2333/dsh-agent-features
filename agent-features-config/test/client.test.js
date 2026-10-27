import assert from 'node:assert/strict'
import test from 'node:test'

test('one client factory composes every merged UI contribution', async () => {
  const loads = []
  globalThis.window = {
    __ModuleLoader__: {
      load(definition) {
        loads.push(definition)
      },
    },
  }

  await import(`${new URL('../client.js', import.meta.url).href}?merge-test`)
  assert.equal(loads.length, 1)
  assert.equal(loads[0].id, '@que2333/dsh-agent-features')

  class Component {
    constructor(props) {
      this.props = props
      this.state = {}
    }
  }
  const React = {
    Component,
    Fragment: Symbol('Fragment'),
    createElement() {
      return null
    },
    useCallback: (callback) => callback,
    useEffect() {},
    useId: () => 'test-id',
    useLayoutEffect() {},
    useMemo: (factory) => factory(),
    useRef: (value) => ({ current: value }),
    useState: (value) => [value, () => {}],
    useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
  }
  const exports = loads[0].factory((specifier) => {
    if (specifier === 'react') return React
    if (specifier === 'react-dom') return { createPortal: () => null }
    throw new Error(`unexpected client dependency: ${specifier}`)
  })

  assert.deepEqual(exports.inject, [
    'slots',
    'locale',
    'configForms',
    'sessions',
    'uiWorkspace',
  ])

  const dictionaries = []
  const registrations = []
  const ctx = {
    configForms: {
      get(id) {
        assert.equal(id, 'agent-config')
        return {}
      },
    },
    effect(effect) {
      effect()
      return () => {}
    },
    locale: {
      bind() {
        return (key) => key
      },
      register(namespace, values) {
        dictionaries.push({ namespace, values })
        return () => {}
      },
    },
    sessions: {},
    slots: {
      inject(_name, callback) {
        callback()
      },
      register(definition) {
        registrations.push(definition)
        return () => {}
      },
    },
    uiWorkspace: {
      unarchiveSession() {},
    },
  }

  exports.apply(ctx)

  assert.deepEqual(
    dictionaries.map((entry) => entry.namespace).sort(),
    ['agent-config', 'edit-message', 'session-delete'],
  )
  assert.deepEqual(
    registrations.map((entry) => entry.id ?? `${entry.name}:${entry.key}`).sort(),
    ['agent-config', 'archived-sessions', 'conversation.chat.node:user'],
  )
  assert.equal(
    registrations.find((entry) => entry.name === 'conversation.chat.node').priority,
    -1,
  )
})
