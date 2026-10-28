import { cp, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const components = new Map([
  ['agent-config', '@que2333/dsh-agent-config'],
  ['session-delete', '@que2333/dsh-session-delete'],
  ['edit-message', '@que2333/dsh-edit-message'],
])
const publishedEntries = [
  'package.json',
  'index.js',
  'client.js',
  'cordis.patch.yml',
  'icon.svg',
  'README.md',
  'locale',
]

for (const [sourceName, packageName] of components) {
  const source = path.join(root, sourceName)
  const target = path.join(root, 'node_modules', packageName)
  await rm(target, { recursive: true, force: true })
  await mkdir(target, { recursive: true })
  for (const entry of publishedEntries) {
    await cp(path.join(source, entry), path.join(target, entry), { recursive: true })
  }
}
