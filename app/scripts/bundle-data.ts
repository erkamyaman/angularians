/**
 * Before `dev` and `build`: validate the collector's files in `data/` and bundle them into one JSON file
 * that the API routes and the server functions both read (`src/server/data/store.ts`). The nightly data commit triggers a new build.
 *
 *   node scripts/bundle-data.ts [dataDir]
 *   CONTRIBUTORS_DATA_DIR=dir pnpm build   (another data folder, e.g. sample data for testing)
 */
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PACKAGES_FILE, parseContributorsFile, parsePackagesFile, parseProfilesFile, parseRenamesFile, parseTeamFile, periodFromFile, PROFILES_FILE, RENAMES_FILE, TEAM_FILE } from '@angularians/shared'
import type { DataBundle } from '../src/server/data/bundle.ts'

const here = dirname(fileURLToPath(import.meta.url))
const dataDir = resolve(process.argv[2] ?? process.env['CONTRIBUTORS_DATA_DIR'] ?? join(here, '../../data'))
const output = join(here, '../src/server/data/bundle.generated.json')

const files = existsSync(dataDir) ? await readdir(dataDir) : []
const bundle: DataBundle = { meta: null, periods: {}, profiles: [], packages: [], team: [], renames: [] }

for (const file of files.sort()) {
  const period = periodFromFile(file)
  if (period) {
    // Ranked and recomputed from the PR counts, so the bundle can be trusted as is.
    const rows = parseContributorsFile(JSON.parse(await readFile(join(dataDir, file), 'utf8')))
    bundle.periods[period] = rows
  }
}
if (files.includes(PROFILES_FILE)) {
  bundle.profiles = parseProfilesFile(JSON.parse(await readFile(join(dataDir, PROFILES_FILE), 'utf8')))
}
if (files.includes(PACKAGES_FILE)) {
  bundle.packages = parsePackagesFile(JSON.parse(await readFile(join(dataDir, PACKAGES_FILE), 'utf8')))
}
if (files.includes(TEAM_FILE)) {
  bundle.team = parseTeamFile(JSON.parse(await readFile(join(dataDir, TEAM_FILE), 'utf8')))
}
if (files.includes(RENAMES_FILE)) {
  bundle.renames = parseRenamesFile(JSON.parse(await readFile(join(dataDir, RENAMES_FILE), 'utf8')))
}
if (files.includes('meta.json')) {
  const meta = JSON.parse(await readFile(join(dataDir, 'meta.json'), 'utf8')) as Record<string, unknown>
  bundle.meta = {
    collectedAt: typeof meta.collectedAt === 'string' ? meta.collectedAt : null,
    partial: meta.partial === true,
    repos: Array.isArray(meta.repos) ? meta.repos.filter((repo): repo is string => typeof repo === 'string') : [],
  }
}

await mkdir(dirname(output), { recursive: true })
await writeFile(output, JSON.stringify(bundle), 'utf8')
const counts = Object.entries(bundle.periods).map(([period, rows]) => `${period}: ${rows.length}`).join(', ')
console.log(`Bundled ${dataDir} → ${output}`)
console.log(`  ${counts || 'no period files (the site shows an empty leaderboard)'}; ${bundle.profiles.length} profiles, ${bundle.packages.length} with packages, ${bundle.team.length} team members`)
