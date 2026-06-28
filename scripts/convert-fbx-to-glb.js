/**
 * convert-fbx-to-glb.js
 *
 * Finds every .fbx file under public/assets/environment/Cyberpunk/ and converts
 * each to a .glb sitting in the same folder. Logs each conversion as it lands.
 *
 * Usage:  node scripts/convert-fbx-to-glb.js
 */

import { readdirSync, existsSync } from 'node:fs'
import { join, dirname, basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import convert from 'fbx2gltf'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')
const targetDir = join(
  projectRoot,
  'public',
  'assets',
  'environment',
  'Cyberpunk'
)

/** Recursively collect every .fbx file under `dir`. */
function findFbxFiles(dir) {
  const found = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      found.push(...findFbxFiles(fullPath))
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.fbx')) {
      found.push(fullPath)
    }
  }
  return found
}

async function main() {
  if (!existsSync(targetDir)) {
    console.error(`Target folder not found: ${targetDir}`)
    process.exit(1)
  }

  const fbxFiles = findFbxFiles(targetDir)
  console.log(`Found ${fbxFiles.length} .fbx file(s) under Cyberpunk/\n`)

  let converted = 0
  let failed = 0

  for (const fbxPath of fbxFiles) {
    // Same folder, same basename, .glb extension. (-b => binary .glb)
    const glbPath = join(
      dirname(fbxPath),
      basename(fbxPath, '.fbx') + '.glb'
    )
    const rel = (p) => p.slice(projectRoot.length + 1)
    try {
      // fbx2gltf resolves with the actual output path on success.
      const dest = await convert(fbxPath, glbPath, ['--binary'])
      converted++
      console.log(`[${converted + failed}/${fbxFiles.length}] OK   ${rel(fbxPath)} -> ${rel(dest)}`)
    } catch (err) {
      failed++
      console.error(`[${converted + failed}/${fbxFiles.length}] FAIL ${rel(fbxPath)}`)
      console.error(`        ${err && err.message ? err.message : err}`)
    }
  }

  console.log(`\nDone. ${converted} converted, ${failed} failed.`)
  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
