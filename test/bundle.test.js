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
  const componentPackages = {
    'agent-config': '@que2333/dsh-agent-config',
    'session-delete': '@que2333/dsh-session-delete',
    'edit-message': '@que2333/dsh-edit-message',
  }

  assert.equal(manifest.name, '@que2333/dsh-agent-features')
  assert.equal(manifest.version, '1.5.0')
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(manifest.exports['./client'], undefined)
  assert.equal(manifest.dsh.client, undefined)
  assert.equal(manifest.dependencies['@deepseek-ai/schemastery'], '~3.18.5')
  assert.deepEqual(manifest.bundleDependencies, [
    '@que2333/dsh-agent-config',
    '@que2333/dsh-edit-message',
    '@que2333/dsh-session-delete',
  ])
  assert.doesNotMatch(patch, /@que2333\/dsh-agent-features(?:\/|'|$)/)

  for (const component of components) {
    const packageName = componentPackages[component]
    assert.equal(manifest.exports[`./${component}`], `./${component}/index.js`)
    assert.equal(manifest.exports[`./${component}/icon`], `./${component}/icon.svg`)
    assert.equal(
      manifest.exports[`./${component}/locale/*.json`],
      `./${component}/locale/*.json`,
    )
    assert.match(
      patch,
      new RegExp(`id: ${component}\\s+name: '${packageName}'`),
    )
    await access(path.join(root, component, 'index.js'))
    await access(path.join(root, component, 'client.js'))

    const componentManifest = JSON.parse(
      await readFile(path.join(root, component, 'package.json'), 'utf8'),
    )
    assert.equal(componentManifest.dsh.bundle, undefined)
    assert.equal(componentManifest.dsh.client.platform, 'web')
    assert.equal(componentManifest.exports['./client'], './client.js')

    const bundledManifest = JSON.parse(
      await readFile(path.join(root, 'node_modules', packageName, 'package.json'), 'utf8'),
    )
    assert.equal(bundledManifest.name, packageName)
    assert.equal(bundledManifest.version, componentManifest.version)
    assert.deepEqual(bundledManifest.dsh, componentManifest.dsh)

    for (const file of [
      'index.js',
      'client.js',
      'cordis.patch.yml',
      'icon.svg',
      'README.md',
      'locale/en.json',
      'locale/zh.json',
    ]) {
      assert.deepEqual(
        await readFile(
          path.join(root, 'node_modules', packageName, file),
        ),
        await readFile(path.join(root, component, file)),
      )
    }
  }

  for (const file of ['locale/en.json', 'locale/zh.json', 'icon.svg']) {
    await access(path.join(root, file))
  }

  await assert.rejects(access(path.join(root, 'client.js')))
})
