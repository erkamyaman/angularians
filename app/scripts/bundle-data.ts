/**
 * Before `dev` and `build`: validate the collector's files in `data/` and bundle them into one JSON file
 * that the API routes and the server functions both read (`src/server/data/store.ts`). The nightly data commit triggers a new build.
 *
 *   node scripts/bundle-data.ts [dataDir]
 *   CONTRIBUTORS_DATA_DIR=dir pnpm build   (another data folder, e.g. sample data for testing)
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readDataDir } from '@angularians/shared/node'
import type { DataBundle } from '../src/server/data/bundle.ts'

const here = dirname(fileURLToPath(import.meta.url))
const dataDir = resolve(process.argv[2] ?? process.env['CONTRIBUTORS_DATA_DIR'] ?? join(here, '../../data'))
const output = join(here, '../src/server/data/bundle.generated.json')

// Ranked and recomputed from the counts, so the bundle can be trusted as is.
const bundle: DataBundle = await readDataDir(dataDir)

await mkdir(dirname(output), { recursive: true })
await writeFile(output, JSON.stringify(bundle), 'utf8')
const counts = Object.entries(bundle.periods).map(([period, rows]) => `${period}: ${rows.length}`).join(', ')
console.log(`Bundled ${dataDir} → ${output}`)
console.log(`  ${counts || 'no period files (the site shows an empty leaderboard)'}; ${bundle.profiles.length} profiles, ${bundle.packages.length} with packages, ${bundle.team.length} team members`)
