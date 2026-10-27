import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

test('bundle mounts three independently manageable component packages', async () => {
  const manifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
  const patch = await readFile(path.join(root, 'cordis.patch.yml'), 'utf8')
  const components = ['agent-config', 'session-delete', 'edit-message']

  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(manifest.dsh.client, undefined)
  assert.deepEqual(manifest.dependencies, {
    '@deepseek-ai/schemastery': '~3.18.5',
  })
  assert.equal(manifest.bundledDependencies, undefined)

  assert.match(patch, /id: agent-config\s+name: '@que2333\/dsh-agent-features\/agent-config'/)
  assert.match(patch, /id: session-delete\s+name: '@que2333\/dsh-agent-features\/session-delete'/)
  assert.match(patch, /id: edit-message\s+name: '@que2333\/dsh-agent-features\/edit-message'/)

  for (const component of components) {
    const componentManifest = JSON.parse(
      await readFile(path.resolve(root, 'components', component, 'package.json'), 'utf8'),
    )
    assert.equal(componentManifest.dsh.bundle, undefined)
    assert.notEqual(componentManifest.dsh.client, undefined)
  }
})
