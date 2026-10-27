import z from '@deepseek-ai/schemastery'

/** Stable plugin identity and the provider entry that owns the wire protocol. */
const NAMESPACE = 'agent-config'
const LLM_ENTRY_ID = 'llm-pi-ai'
const COMPLETIONS_API = 'openai-completions'
const RESPONSES_API = 'openai-responses'
const PAYLOAD_BRIDGE = Symbol.for('@local/agent-config/responses-payload-bridge')

const SUMMARY_LEVELS = new Set(['auto', 'concise', 'detailed', 'none'])
const VERBOSITY_LEVELS = new Set(['default', 'low', 'medium', 'high'])
const HIDDEN_REASONING_EVENTS = new Set([
  'thinking_start',
  'thinking_delta',
  'thinking_end',
])
const REASONING_BLOCK_TYPES = new Set(['reasoning', 'thinking'])

/**
 * Fresh configuration fields.
 *
 * The names deliberately differ from the pre-2.0 plugin so no legacy value can
 * leak into the rebuilt implementation.
 */
const Fields = {
  summaryLevel: z.union(['auto', 'concise', 'detailed', 'none']).default('auto'),
  outputVerbosity: z.union(['default', 'low', 'medium', 'high']).default('default'),
}
z.object(Fields)

/** Live fields projected to the browser settings page. */
export const Config = z.object({
  summaryLevel: Fields.summaryLevel.volatile(),
  outputVerbosity: Fields.outputVerbosity.volatile(),
})

/** Resolve the effective API named by one provider route in a config-editor model. */
export function configuredProviderApi(configEditor, provider) {
  if (configEditor === undefined || typeof configEditor.entries !== 'function') return undefined
  const entry = configEditor.entries().find((candidate) => candidate.options.id === LLM_ENTRY_ID)
  const providers = entry?.options?.config?.providers
  const profile = providers !== null && typeof providers === 'object' ? providers[provider] : undefined
  return profile !== null && typeof profile === 'object' && typeof profile.api === 'string'
    ? profile.api
    : undefined
}

/** Response protocols all accept the native reasoning and text controls. */
export function isResponsesApi(api) {
  return typeof api === 'string' && api.endsWith('-responses')
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function normalizedValues(values) {
  return {
    summaryLevel: SUMMARY_LEVELS.has(values?.summaryLevel) ? values.summaryLevel : 'auto',
    outputVerbosity: VERBOSITY_LEVELS.has(values?.outputVerbosity)
      ? values.outputVerbosity
      : 'default',
  }
}

function withoutReplayReasoning(replayState) {
  if (!isRecord(replayState) || !Array.isArray(replayState.blocks)) return replayState
  const blocks = replayState.blocks.filter((block) => !REASONING_BLOCK_TYPES.has(block?.type))
  return blocks.length === replayState.blocks.length ? replayState : { ...replayState, blocks }
}

/**
 * Remove reasoning blocks from a completed assistant message.
 *
 * pi-ai calls these blocks `thinking`; DSH projects them as `reasoning`. Both
 * spellings are handled so the helper also remains safe for replay envelopes.
 * The input message is never mutated.
 */
export function withoutReasoning(message) {
  if (!isRecord(message)) return message

  const content = Array.isArray(message.content)
    ? message.content.filter((block) => !REASONING_BLOCK_TYPES.has(block?.type))
    : message.content
  const contentChanged = Array.isArray(message.content) && content.length !== message.content.length
  const replayState = withoutReplayReasoning(message.replayState)
  const replayChanged = replayState !== message.replayState

  if (!contentChanged && !replayChanged) return message
  return {
    ...message,
    ...(contentChanged ? { content } : {}),
    ...(replayChanged ? { replayState } : {}),
  }
}

/**
 * Hide upstream reasoning without adding a model request or changing text,
 * tool calls, usage, or finish reasons.
 *
 * Some compatible gateways still emit thinking events when summary output is
 * not requested. Filtering at the pi-ai stream boundary prevents DSH from
 * displaying them while preserving the native result() contract.
 */
export function filterReasoningEvents(stream) {
  if (
    stream === null ||
    (typeof stream !== 'object' && typeof stream !== 'function') ||
    typeof stream[Symbol.asyncIterator] !== 'function'
  ) {
    return stream
  }

  return {
    async *[Symbol.asyncIterator]() {
      for await (const event of stream) {
        if (!isRecord(event)) {
          yield event
          continue
        }
        if (HIDDEN_REASONING_EVENTS.has(event.type)) continue
        if (event.type === 'done') {
          const message = withoutReasoning(event.message)
          yield message === event.message ? event : { ...event, message }
          continue
        }
        if (event.type === 'error') {
          const error = withoutReasoning(event.error)
          yield error === event.error ? event : { ...event, error }
          continue
        }
        yield event
      }
    },
    result() {
      if (typeof stream.result !== 'function') return Promise.resolve(undefined)
      return Promise.resolve(stream.result()).then(withoutReasoning)
    },
  }
}

/**
 * Apply the selected options to the final Responses request payload.
 *
 * These values mirror Codex's final Responses payload:
 * - auto/concise/detailed write reasoning.summary
 * - none omits reasoning.summary entirely
 * - default omits text.verbosity
 * - low/medium/high write text.verbosity
 *
 * The input payload is never mutated.
 */
export function applyResponsesOptions(payload, values) {
  if (!isRecord(payload)) return payload
  const selected = normalizedValues(values)
  let next = payload
  let changed = false

  if (isRecord(payload.reasoning)) {
    if (selected.summaryLevel === 'none') {
      if (Object.hasOwn(payload.reasoning, 'summary')) {
        const { summary: _summary, ...reasoning } = payload.reasoning
        next = { ...next, reasoning }
        changed = true
      }
    } else if (payload.reasoning.summary !== selected.summaryLevel) {
      next = {
        ...next,
        reasoning: {
          ...payload.reasoning,
          summary: selected.summaryLevel,
        },
      }
      changed = true
    }
  }

  if (selected.outputVerbosity !== 'default') {
    const text = isRecord(payload.text) ? payload.text : {}
    if (text.verbosity !== selected.outputVerbosity) {
      next = {
        ...next,
        text: {
          ...text,
          verbosity: selected.outputVerbosity,
        },
      }
      changed = true
    }
  }

  return changed ? next : payload
}

/**
 * Bridge live settings into pi-ai's final Responses payload.
 *
 * DSH's pi-ai adapter does not forward summary or verbosity fields by itself.
 * Wrapping `onPayload` is intentionally used instead of adding non-standard
 * top-level options: it works for standard and Azure Responses providers and
 * leaves every non-Responses route unchanged.
 */
export function installResponsesPayloadBridge(llm, readValues) {
  const registrations = llm?.adapters
  if (registrations === undefined || typeof registrations.values !== 'function') return () => {}

  const cleanups = []
  for (const registration of registrations.values()) {
    const adapter = registration?.adapter
    if (
      adapter === null ||
      typeof adapter !== 'object' ||
      typeof adapter.current !== 'function' ||
      typeof adapter.prepareCall !== 'function' ||
      typeof adapter.streamWithSnapshot !== 'function'
    ) {
      continue
    }

    const originalPrepareCall = adapter.prepareCall
    if (originalPrepareCall[PAYLOAD_BRIDGE] === true) continue

    const wrapModels = (models) => {
      if (
        models === null ||
        typeof models !== 'object' ||
        typeof models.streamSimple !== 'function'
      ) {
        return
      }
      const existing = models[PAYLOAD_BRIDGE]
      if (existing !== undefined) {
        if (existing.active === true) return
        cleanups.push(existing.restore)
      }

      const originalStreamSimple = models.streamSimple
      const bridge = { active: true }
      const wrappedStreamSimple = function (model, context, options) {
        if (!bridge.active || !isResponsesApi(model?.api)) {
          return originalStreamSimple.call(this, model, context, options)
        }

        const selected = normalizedValues(readValues())
        const next = isRecord(options) ? { ...options } : {}
        const originalOnPayload = next.onPayload
        next.onPayload = async (payload, payloadModel) => {
          let effective = payload
          if (typeof originalOnPayload === 'function') {
            const returned = await originalOnPayload(payload, payloadModel)
            if (returned !== undefined) effective = returned
          }
          return applyResponsesOptions(effective, selected)
        }
        const stream = originalStreamSimple.call(this, model, context, next)
        return selected.summaryLevel === 'none' ? filterReasoningEvents(stream) : stream
      }

      bridge.restore = () => {
        bridge.active = false
        if (models[PAYLOAD_BRIDGE] !== bridge) return
        if (models.streamSimple === wrappedStreamSimple) models.streamSimple = originalStreamSimple
        delete models[PAYLOAD_BRIDGE]
      }

      try {
        models.streamSimple = wrappedStreamSimple
        models[PAYLOAD_BRIDGE] = bridge
        cleanups.push(bridge.restore)
      } catch {
        // A future adapter may freeze its model collection; leave it unchanged.
      }
    }

    const wrappedPrepareCall = function (provider, model, signal) {
      try {
        wrapModels(adapter.current()?.models)
      } catch {
        // The original prepare path owns and reports adapter failures.
      }
      return originalPrepareCall.call(adapter, provider, model, signal)
    }
    wrappedPrepareCall[PAYLOAD_BRIDGE] = true

    try {
      adapter.prepareCall = wrappedPrepareCall
    } catch {
      continue
    }
    cleanups.push(() => {
      if (adapter.prepareCall === wrappedPrepareCall) adapter.prepareCall = originalPrepareCall
    })
  }

  return () => {
    for (let index = cleanups.length - 1; index >= 0; index -= 1) cleanups[index]()
  }
}

/**
 * Migrate one OpenAI-compatible provider from Chat Completions to Responses.
 *
 * Other protocols are left alone because changing an Anthropic, Gemini, or
 * local route to Responses would make it unusable. The edit is idempotent.
 */
export async function ensureProviderResponses(configEditor, provider) {
  if (typeof provider !== 'string' || provider === '') return false
  if (configuredProviderApi(configEditor, provider) !== COMPLETIONS_API) return false
  const entry = configEditor.entries().find((candidate) => candidate.options.id === LLM_ENTRY_ID)
  if (entry === undefined || typeof configEditor.edit !== 'function') return false
  let changed = false
  await configEditor.edit(entry, (raw) => {
    const current = isRecord(raw) ? raw : {}
    const providers = isRecord(current.providers) ? current.providers : {}
    const profile = providers[provider]
    if (!isRecord(profile) || profile.api !== COMPLETIONS_API) return current
    changed = true
    return {
      ...current,
      providers: {
        ...providers,
        [provider]: {
          ...profile,
          api: RESPONSES_API,
        },
      },
    }
  })
  return changed
}

/** Migrate only the provider selected as the default. */
export async function ensureDefaultProviderResponses(configEditor, agentDefaultModel) {
  const selection = agentDefaultModel?.currentSelection?.()
  return ensureProviderResponses(configEditor, selection?.provider)
}

/** Read both live values with one settings snapshot, falling back to startup config. */
function readValues(settings, config) {
  let value
  try {
    const entry = settings.describe().find((candidate) => candidate.ns === NAMESPACE)
    value = entry === undefined ? undefined : entry.value
  } catch {
    value = undefined
  }

  const read = (field) => {
    if (isRecord(value) && typeof value[field] === 'string') return value[field]
    const reference = config === undefined ? undefined : config[field]
    if (reference !== null && typeof reference === 'object' && typeof reference.get === 'function') {
      try {
        return reference.get()
      } catch {
        return undefined
      }
    }
    return typeof reference === 'string' ? reference : undefined
  }

  return normalizedValues({
    summaryLevel: read('summaryLevel'),
    outputVerbosity: read('outputVerbosity'),
  })
}

/** Install the settings policy, provider migration, and native Responses bridge. */
export function apply(ctx, config) {
  ctx.inject(['configEditor', 'agentDefaultModel'], (child) => {
    child.effect(() => {
      let active = true
      // Let activation finish before a migration can trigger a Loader reload.
      const timer = setTimeout(() => {
        if (!active) return
        ensureDefaultProviderResponses(child.configEditor, child.agentDefaultModel).catch((error) => {
          child.logger.warn('agent-config: could not migrate the default provider to Responses: %o', error)
        })
      }, 0)
      return () => {
        active = false
        clearTimeout(timer)
      }
    }, 'agent-config: default Responses protocol')
  })

  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.effect(
      () => settingsCtx.settings.configure({ auto: false }, ctx.fiber),
      'agent-config: settings page policy',
    )
  })

  ctx.inject(['settings', 'llm'], (child) => {
    child.effect(
      () => installResponsesPayloadBridge(child.llm, () => readValues(child.settings, config)),
      'agent-config: native Responses options',
    )
  })
}
