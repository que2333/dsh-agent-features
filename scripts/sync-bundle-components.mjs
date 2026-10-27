import { cp, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const bundle = path.join(root, 'agent-features-config')
const targets = path.join(bundle, 'components')
const components = ['agent-config', 'session-delete', 'edit-message']
const publishedEntries = [
  'package.json',
  'index.js',
  'client.js',
  'cordis.patch.yml',
  'icon.svg',
  'README.md',
  'locale',
]

if (path.dirname(targets) !== bundle) throw new Error('refusing to replace components outside the bundle')
await rm(targets, { recursive: true, force: true })
for (const component of components) {
  const target = path.join(targets, component)
  await mkdir(target, { recursive: true })
  for (const entry of publishedEntries) {
    await cp(path.join(root, component, entry), path.join(target, entry), { recursive: true })
  }
}
