import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { META_FILE, periodFile, toJsonLines, type ContributorRecord } from '@angularians/shared'
import { readDataDir } from '@angularians/shared/node'
import { fetchAdvisories } from './advisories.ts'
import { parseConfig } from './config.ts'
import { refreshAdvisoryRecords } from './refresh-advisory-records.ts'

const config = parseConfig(process.argv.slice(2), process.env)
if (config.since || config.part) throw new Error('Refresh advisories against a full data snapshot, without --since or --part.')
const folder = await readDataDir(config.outputDir)
if (!folder.periods['all']?.length || !folder.meta?.collectedAt || folder.meta.partial) {
  throw new Error('A full collected data folder is required before refreshing advisories.')
}
const snapshotDate = new Date(folder.meta.collectedAt)
if (Number.isNaN(snapshotDate.getTime())) throw new Error('The snapshot has no valid collection date.')
const previous = new Map(Object.entries(folder.periods).map(([period, rows]) => [
  period, rows.map(({ rank: _rank, ...record }): ContributorRecord => record),
]))
const advisories = await fetchAdvisories(null)
if (!advisories.length) throw new Error('No advisories collected: refusing to replace existing credits.')
const refreshed = refreshAdvisoryRecords(previous, advisories, snapshotDate)
const meta = JSON.parse(await readFile(join(config.outputDir, META_FILE), 'utf8')) as Record<string, unknown>
for (const [period, records] of refreshed) {
  await writeFile(join(config.outputDir, periodFile(period)), toJsonLines(records), 'utf8')
}
await writeFile(join(config.outputDir, META_FILE), JSON.stringify({
  ...meta, contributors: refreshed.get('all')?.length ?? 0,
  advisories: advisories.length, advisoriesCollectedAt: new Date().toISOString(),
}, null, 2) + '\n', 'utf8')
console.log(`Refreshed ${advisories.length} advisories in ${refreshed.size} period files; other activity keeps its snapshot date.`)
