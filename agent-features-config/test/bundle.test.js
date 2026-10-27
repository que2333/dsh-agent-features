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
    '@local/agent-config': 'link:../agent-config',
    '@local/session-delete': 'link:../session-delete',
    '@local/edit-message': 'link:../edit-message',
  })

  assert.match(patch, /id: agent-config\s+name: '@local\/agent-config'/)
  assert.match(patch, /id: session-delete\s+name: '@local\/session-delete'/)
  assert.match(patch, /id: edit-message\s+name: '@local\/edit-message'/)

  for (const component of components) {
    const componentManifest = JSON.parse(
      await readFile(path.resolve(root, '..', component, 'package.json'), 'utf8'),
    )
    assert.equal(componentManifest.dsh.bundle, undefined)
    assert.notEqual(componentManifest.dsh.client, undefined)
  }
})
