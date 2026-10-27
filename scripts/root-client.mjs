import { readFile } from 'node:fs/promises'
import path from 'node:path'

const components = [
  ['agent-config', 'createAgentConfigClient'],
  ['session-delete', 'createSessionDeleteClient'],
  ['edit-message', 'createEditMessageClient'],
]

const factoryStart = '  factory(require) {\n'
const factoryEnd = '\n  },\n})\n'

function extractFactory(source, filename) {
  const start = source.indexOf(factoryStart)
  const end = source.lastIndexOf(factoryEnd)
  if (start < 0 || end < start) {
    throw new Error(`${filename}: expected one __ModuleLoader__ factory`)
  }
  const body = source.slice(start + factoryStart.length, end)
  if (!body.includes('    return {')) {
    throw new Error(`${filename}: factory does not return a client definition`)
  }
  return body
}

/** Render the aggregate browser bundle from the three focused client bundles. */
export async function renderRootClient(root) {
  const functions = []
  for (const [component, functionName] of components) {
    const filename = path.join(root, component, 'client.js')
    const source = (await readFile(filename, 'utf8')).replaceAll('\r\n', '\n')
    const body = extractFactory(source, filename)
    functions.push(`function ${functionName}(require) {\n${body}\n}\n`)
  }

  return `window.__ModuleLoader__.load({
  id: '@que2333/dsh-agent-features',
  factory(require) {
    const agentConfig = createAgentConfigClient(require)
    const sessionDelete = createSessionDeleteClient(require)
    const editMessage = createEditMessageClient(require)

    return {
      inject: ['slots', 'locale', 'configForms', 'sessions', 'uiWorkspace'],
      apply(ctx) {
        agentConfig.apply(ctx)
        sessionDelete.apply(ctx)
        editMessage.apply(ctx)
      },
    }
  },
})

${functions.join('\n')}`
}
