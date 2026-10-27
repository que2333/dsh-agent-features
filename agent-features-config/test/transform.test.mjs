import assert from 'node:assert/strict'
import {
  applyResponsesOptions,
  configuredProviderApi,
  ensureDefaultProviderResponses,
  ensureProviderResponses,
  filterReasoningEvents,
  installResponsesPayloadBridge,
  isResponsesApi,
  withoutReasoning,
} from '../index.js'

const basePayload = {
  model: 'm',
  input: [],
  reasoning: { effort: 'high', summary: 'auto' },
  text: { format: { type: 'text' } },
}

assert.equal(
  applyResponsesOptions(basePayload, {
    summaryLevel: 'auto',
    outputVerbosity: 'default',
  }),
  basePayload,
  'auto/default must leave an already matching native payload untouched',
)
const autoWithoutSummary = applyResponsesOptions(
  { model: 'm', reasoning: { effort: 'high' } },
  { summaryLevel: 'auto', outputVerbosity: 'default' },
)
assert.equal(autoWithoutSummary.reasoning.summary, 'auto')
assert.equal(autoWithoutSummary.text, undefined)

assert.equal(
  applyResponsesOptions(basePayload, {
    summaryLevel: 'not-a-level',
    outputVerbosity: 'not-a-level',
  }),
  basePayload,
  'invalid values must fall back to auto/default',
)

const concise = applyResponsesOptions(basePayload, {
  summaryLevel: 'concise',
  outputVerbosity: 'low',
})
assert.notEqual(concise, basePayload)
assert.equal(concise.reasoning.effort, 'high')
assert.equal(concise.reasoning.summary, 'concise')
assert.equal(concise.text.verbosity, 'low')
assert.deepEqual(concise.text.format, { type: 'text' })
assert.equal(basePayload.reasoning.summary, 'auto', 'the source payload must not be mutated')
assert.equal(basePayload.text.verbosity, undefined)

const none = applyResponsesOptions(basePayload, {
  summaryLevel: 'none',
  outputVerbosity: 'high',
})
assert.equal(Object.hasOwn(none.reasoning, 'summary'), false)
assert.equal(none.reasoning.effort, 'high')
assert.equal(none.text.verbosity, 'high')

const detailed = applyResponsesOptions(basePayload, {
  summaryLevel: 'detailed',
  outputVerbosity: 'medium',
})
assert.equal(detailed.reasoning.summary, 'detailed')
assert.equal(detailed.text.verbosity, 'medium')

const noReasoning = applyResponsesOptions(
  { text: {} },
  { summaryLevel: 'concise', outputVerbosity: 'default' },
)
assert.deepEqual(noReasoning, { text: {} }, 'summary alone must not create a reasoning object')

const toolPayload = {
  model: 'm',
  input: [],
  tools: [{ type: 'function', name: 'pwsh' }],
  reasoning: { effort: 'high', summary: 'auto' },
}
const toolOptions = applyResponsesOptions(toolPayload, {
  summaryLevel: 'concise',
  outputVerbosity: 'low',
})
assert.notEqual(toolOptions, toolPayload)
assert.equal(toolOptions.reasoning.summary, 'concise')
assert.equal(toolOptions.text.verbosity, 'low')
assert.equal(toolOptions.instructions, undefined)
assert.equal(toolPayload.instructions, undefined, 'tool instructions must not mutate the source payload')
assert.equal(
  applyResponsesOptions(toolOptions, {
    summaryLevel: 'concise',
    outputVerbosity: 'low',
  }),
  toolOptions,
  'reapplying the same native options must be idempotent',
)
assert.equal(
  applyResponsesOptions(
    { ...toolPayload, instructions: 'Existing instruction' },
    { summaryLevel: 'concise', outputVerbosity: 'low' },
  ).instructions,
  'Existing instruction',
  'tool-enabled requests must preserve existing instructions unchanged',
)

assert.equal(isResponsesApi('openai-completions'), false)
assert.equal(isResponsesApi('openai-responses'), true)
assert.equal(isResponsesApi('azure-openai-responses'), true)

const completionMessage = {
  role: 'assistant',
  content: [
    { type: 'thinking', thinking: 'private reasoning' },
    { type: 'text', text: 'Visible text' },
    { type: 'toolCall', id: 'call-1', name: 'pwsh', arguments: { command: 'pwd' } },
  ],
  provider: 'magpie',
  model: 'm',
  replayState: {
    response: { kind: 'pi-ai', version: 2 },
    blocks: [{ type: 'reasoning' }, { type: 'text' }, { type: 'tool-call' }],
  },
  timestamp: 1,
}
const visibleMessage = withoutReasoning(completionMessage)
assert.notEqual(visibleMessage, completionMessage)
assert.deepEqual(visibleMessage.content, completionMessage.content.slice(1))
assert.deepEqual(visibleMessage.replayState.blocks, [{ type: 'text' }, { type: 'tool-call' }])
assert.equal(completionMessage.content.length, 3, 'the source message must not be mutated')
assert.equal(completionMessage.replayState.blocks.length, 3)
assert.equal(withoutReasoning(null), null)
assert.equal(withoutReasoning({ content: [] }).content.length, 0)

const liveMessage = {
  role: 'assistant',
  content: [{ type: 'thinking', thinking: '' }],
  provider: 'magpie',
  model: 'm',
  timestamp: 1,
}
const sourceEvents = [
  { type: 'start', partial: liveMessage },
  { type: 'thinking_start', contentIndex: 0, partial: liveMessage },
  { type: 'thinking_delta', contentIndex: 0, delta: 'private', partial: liveMessage },
  { type: 'thinking_end', contentIndex: 0, content: 'private', partial: liveMessage },
  { type: 'text_start', contentIndex: 1, partial: liveMessage },
  { type: 'text_delta', contentIndex: 1, delta: 'Visible', partial: liveMessage },
  { type: 'text_end', contentIndex: 1, content: 'Visible', partial: liveMessage },
  { type: 'done', reason: 'stop', message: completionMessage },
]
const sourceStream = {
  async *[Symbol.asyncIterator]() {
    for (const event of sourceEvents) yield event
  },
  result() {
    return Promise.resolve(completionMessage)
  },
}
const filteredEvents = []
for await (const event of filterReasoningEvents(sourceStream)) filteredEvents.push(event)
assert.deepEqual(
  filteredEvents.map((event) => event.type),
  ['start', 'text_start', 'text_delta', 'text_end', 'done'],
)
assert.deepEqual(filteredEvents.at(-1).message.content, completionMessage.content.slice(1))
assert.deepEqual((await filterReasoningEvents(sourceStream).result()).content, completionMessage.content.slice(1))
assert.equal(filterReasoningEvents(null), null)

const errorMessage = {
  ...completionMessage,
  stopReason: 'error',
  errorMessage: 'failed',
}
const errorStream = {
  async *[Symbol.asyncIterator]() {
    yield { type: 'error', reason: 'error', error: errorMessage }
  },
  result() {
    return Promise.resolve(errorMessage)
  },
}
const errorEvents = []
for await (const event of filterReasoningEvents(errorStream)) errorEvents.push(event)
assert.equal(errorEvents[0].type, 'error')
assert.deepEqual(errorEvents[0].error.content, completionMessage.content.slice(1))
assert.deepEqual((await filterReasoningEvents(errorStream).result()).content, completionMessage.content.slice(1))

const providerEntry = {
  options: {
    id: 'llm-pi-ai',
    config: {
      providers: {
        selected: {
          api: 'openai-completions',
          baseURL: 'http://localhost',
          models: [{ id: 'selected-model' }],
        },
        untouched: {
          api: 'openai-completions',
          models: [{ id: 'untouched-model' }],
        },
        anthropic: {
          api: 'anthropic-messages',
          models: [{ id: 'claude' }],
        },
      },
    },
  },
}
let edits = 0
const configEditor = {
  entries() {
    return [providerEntry]
  },
  async edit(target, transform) {
    edits += 1
    target.options.config = transform(target.options.config)
  },
}

assert.equal(configuredProviderApi(configEditor, 'selected'), 'openai-completions')
assert.equal(
  await ensureDefaultProviderResponses(configEditor, {
    currentSelection() {
      return { provider: 'selected', model: 'selected-model' }
    },
  }),
  true,
)
assert.equal(configuredProviderApi(configEditor, 'selected'), 'openai-responses')
assert.equal(configuredProviderApi(configEditor, 'untouched'), 'openai-completions')
assert.equal(configuredProviderApi(configEditor, 'anthropic'), 'anthropic-messages')
assert.deepEqual(providerEntry.options.config.providers.selected.models, [{ id: 'selected-model' }])
assert.equal(providerEntry.options.config.providers.selected.baseURL, 'http://localhost')
assert.equal(edits, 1)
assert.equal(await ensureProviderResponses(configEditor, 'selected'), false)
assert.equal(edits, 1, 'already migrated providers must stay idempotent')
assert.equal(await ensureProviderResponses(configEditor, 'anthropic'), false)

let selectedValues = {
  summaryLevel: 'concise',
  outputVerbosity: 'low',
}
let modelApi = 'openai-responses'
const observed = []
const modelCollection = {
  async streamSimple(model, context, options) {
    const payload = {
      model: model.id,
      reasoning: { effort: 'high', summary: 'auto' },
      text: { format: { type: 'text' } },
    }
    const effective =
      typeof options?.onPayload === 'function'
        ? await options.onPayload(payload, model)
        : payload
    observed.push({ context, model, options, payload: effective })
    return effective
  },
}
const bridgeAdapter = {
  current() {
    return { models: modelCollection }
  },
  prepareCall(provider, model) {
    return Promise.resolve({
      model: { provider, id: model },
      stream(streamOptions) {
        return modelCollection.streamSimple({ api: modelApi }, {}, streamOptions)
      },
    })
  },
  streamWithSnapshot() {},
}
const originalPrepareCall = bridgeAdapter.prepareCall
const llm = {
  adapters: new Map([['p', { adapter: bridgeAdapter }]]),
}
const disposeBridge = installResponsesPayloadBridge(llm, () => selectedValues)

const prepared = await bridgeAdapter.prepareCall('p', 'm')
await prepared.stream({ reasoning: 'high' })
assert.equal(observed.at(-1).payload.reasoning.summary, 'concise')
assert.equal(observed.at(-1).payload.text.verbosity, 'low')
assert.deepEqual(observed.at(-1).payload.text.format, { type: 'text' })

selectedValues = { summaryLevel: 'detailed', outputVerbosity: 'medium' }
await prepared.stream({ reasoning: 'high' })
assert.equal(observed.at(-1).payload.reasoning.summary, 'detailed')
assert.equal(observed.at(-1).payload.text.verbosity, 'medium')

selectedValues = { summaryLevel: 'none', outputVerbosity: 'high' }
await prepared.stream({
  onPayload(payload) {
    return {
      ...payload,
      reasoning: { ...payload.reasoning, summary: 'detailed' },
      text: { ...payload.text, format: { type: 'json_object' } },
    }
  },
})
assert.equal(
  observed.at(-1).payload.reasoning.summary,
  undefined,
  'none must remove an earlier summary value from the payload',
)
assert.equal(observed.at(-1).payload.text.verbosity, 'high')
assert.deepEqual(observed.at(-1).payload.text.format, { type: 'json_object' })

selectedValues = { summaryLevel: 'auto', outputVerbosity: 'default' }
await prepared.stream({ reasoning: 'high' })
assert.equal(observed.at(-1).payload.reasoning.summary, 'auto')
assert.equal(observed.at(-1).payload.text.verbosity, undefined)

modelApi = 'openai-completions'
selectedValues = { summaryLevel: 'concise', outputVerbosity: 'low' }
await prepared.stream({ reasoning: 'high' })
assert.equal(observed.at(-1).payload.reasoning.summary, 'auto')
assert.equal(observed.at(-1).payload.text.verbosity, undefined)

disposeBridge()
assert.equal(bridgeAdapter.prepareCall, originalPrepareCall)
modelApi = 'openai-responses'
selectedValues = { summaryLevel: 'concise', outputVerbosity: 'low' }
const restored = await bridgeAdapter.prepareCall('p', 'm')
await restored.stream({ reasoning: 'high' })
assert.equal(observed.at(-1).payload.reasoning.summary, 'auto')
assert.equal(observed.at(-1).payload.text.verbosity, undefined)

let wrapperSummary = 'concise'
let wrapperSource
const wrapperCollection = {
  streamSimple() {
    wrapperSource = {
      async *[Symbol.asyncIterator]() {
        yield { type: 'start', partial: completionMessage }
        yield { type: 'thinking_start', contentIndex: 0, partial: completionMessage }
        yield { type: 'thinking_delta', contentIndex: 0, delta: 'private', partial: completionMessage }
        yield { type: 'thinking_end', contentIndex: 0, content: 'private', partial: completionMessage }
        yield { type: 'done', reason: 'stop', message: completionMessage }
      },
      result() {
        return Promise.resolve(completionMessage)
      },
    }
    return wrapperSource
  },
}
const wrapperAdapter = {
  current() {
    return { models: wrapperCollection }
  },
  prepareCall() {
    return Promise.resolve({
      model: {},
      stream(streamOptions) {
        return wrapperCollection.streamSimple({ api: 'openai-responses' }, {}, streamOptions)
      },
    })
  },
  streamWithSnapshot() {},
}
const disposeWrapper = installResponsesPayloadBridge(
  { adapters: new Map([['p', { adapter: wrapperAdapter }]]) },
  () => ({ summaryLevel: wrapperSummary, outputVerbosity: 'default' }),
)
const preparedWrapper = await wrapperAdapter.prepareCall('p', 'm')
const visibleStream = await preparedWrapper.stream({})
assert.equal(visibleStream, wrapperSource, 'non-none summaries must keep the original stream')
wrapperSummary = 'none'
const hiddenStream = await preparedWrapper.stream({})
assert.notEqual(hiddenStream, wrapperSource, 'none must wrap the pi-ai stream')
const hiddenEventTypes = []
for await (const event of hiddenStream) hiddenEventTypes.push(event.type)
assert.deepEqual(hiddenEventTypes, ['start', 'done'])
assert.equal((await hiddenStream.result()).content.some((block) => block.type === 'thinking'), false)
disposeWrapper()

console.log('agent-features-config 1.0.0 ok', {
  payloads: observed.length,
  edits,
  bridgeRestored: bridgeAdapter.prepareCall === originalPrepareCall,
})
