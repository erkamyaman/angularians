/**
 * The site's data from the parts of several `--part` runs (one CI job per repository, in parallel: one after the
 * other they would not fit in a job's time limit). Then the team, the profiles and meta.json, as a single run does.
 *
 *   node src/merge.ts [--out=dir] [--no-profiles] partDir...
 */
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mergeCalendars, mergePackages, mergeRecords, type ContributorRecord, type Period } from '@angularians/shared'
import { emptyStats, readPart, writeData, type Collected, type Stats } from './finalize.ts'

export function mergeParts(parts: readonly Collected[]): Collected {
  if (!parts.length) throw new Error('No parts to merge')
  const { activity } = parts[0]!
  // A test run's `--since=7d` starts a few seconds apart in each job: only a test part with a full one is an error.
  const tests = parts.filter(part => part.since !== null)
  if ((tests.length && tests.length < parts.length) || parts.some(part => part.activity !== activity)) {
    throw new Error('A test run (--since) and a full one, or runs with and without --activity: run them again together')
  }
  const since = tests.map(part => part.since!).sort()[0] ?? null
  const periods = new Map<Period, ContributorRecord[][]>()
  for (const part of parts) {
    for (const [period, records] of part.files) {
      if (!periods.has(period)) periods.set(period, [])
      periods.get(period)!.push(records)
    }
  }
  const stats = emptyStats()
  for (const part of parts) for (const key of Object.keys(stats) as Array<keyof Stats>) stats[key] += part.stats[key] ?? 0
  return {
    repos: parts.flatMap(part => part.repos),
    // The earliest start: the rolling periods of every part end about there.
    collectedAt: parts.map(part => part.collectedAt).sort()[0]!,
    since,
    activity,
    files: new Map([...periods].map(([period, lists]) => [period, mergeRecords(lists)])),
    packages: mergePackages(parts.map(part => part.packages)),
    calendar: mergeCalendars(parts.map(part => part.calendar)),
    stats,
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2).filter(arg => arg !== '--')
  const out = args.find(arg => arg.startsWith('--out='))?.slice('--out='.length)
  const profiles = !args.includes('--no-profiles')
  const dirs = args.filter(arg => !arg.startsWith('--'))
  const unknown = args.filter(arg => arg.startsWith('--') && !arg.startsWith('--out=') && arg !== '--no-profiles')
  if (unknown.length || !dirs.length) throw new Error(`Usage: node src/merge.ts [--out=dir] [--no-profiles] partDir... (unknown: ${unknown.join(' ') || 'none'})`)

  const parts = await Promise.all(dirs.map(dir => readPart(resolve(dir))))
  const collected = mergeParts(parts)
  console.log(`Merging ${collected.repos.join(', ')}`)
  await writeData(resolve(out ?? fileURLToPath(new URL('../../data', import.meta.url))), collected, { profiles })
}
