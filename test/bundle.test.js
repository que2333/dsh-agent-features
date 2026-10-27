import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

test('the repository root is directly installable as a DSH bundle', async () => {
  const manifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
  const patch = await readFile(path.join(root, 'cordis.patch.yml'), 'utf8')
  const components = ['agent-config', 'session-delete', 'edit-message']

  assert.equal(manifest.name, '@que2333/dsh-agent-features')
  assert.equal(manifest.version, '1.4.0')
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(manifest.dsh.client, undefined)
  assert.deepEqual(manifest.dependencies, {
    '@deepseek-ai/schemastery': '~3.18.5',
  })

  for (const component of components) {
    assert.equal(manifest.exports[`./${component}`], `./${component}/index.js`)
    assert.equal(manifest.exports[`./${component}/icon`], `./${component}/icon.svg`)
    assert.equal(
      manifest.exports[`./${component}/locale/*.json`],
      `./${component}/locale/*.json`,
    )
    assert.match(
      patch,
      new RegExp(
        `id: ${component}\\s+name: '@que2333/dsh-agent-features/${component}'`,
      ),
    )
    await access(path.join(root, component, 'index.js'))
    await access(path.join(root, component, 'client.js'))

    const componentManifest = JSON.parse(
      await readFile(path.join(root, component, 'package.json'), 'utf8'),
    )
    assert.equal(componentManifest.dsh.bundle, undefined)
    assert.equal(componentManifest.dsh.client.platform, 'web')
    assert.equal(componentManifest.exports['./client'], './client.js')
  }

  for (const file of ['locale/en.json', 'locale/zh.json', 'icon.svg']) {
    await access(path.join(root, file))
  }
})
