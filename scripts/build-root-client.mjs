import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderRootClient } from './root-client.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const output = await renderRootClient(root)
await writeFile(path.join(root, 'client.js'), output)
