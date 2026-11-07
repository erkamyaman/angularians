import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  CALENDAR_FILE,
  decodeCalendar,
  encodeCalendar,
  META_FILE,
  PACKAGES_FILE,
  periodFile,
  parseUserIdsFile,
  PROFILES_FILE,
  RENAMES_FILE,
  TEAM_FILE,
  toJsonLines,
  updatedRenames,
  type Calendar,
  type ContributorRecord,
  type PackagesRecord,
  type Period,
  type ProfileRecord,
  type TeamRecord,
} from '@angularians/shared'
import { readDataFile } from '@angularians/shared/node'
import { collectProfiles } from './profiles.ts'
import { publicMembers } from './team.ts'

/** Below this, a full run is most likely broken (token, API): keep the previous files. */
const MIN_FULL_RUN_CONTRIBUTORS = 1000
/** What a `--part` run writes besides its period files and packages.json: what `merge.ts` needs to finish. */
export const PART_FILE = 'part.json'

/** What a run read and found, for meta.json: collected items, not contribution kinds. */
const STATS = [
  'pulls', 'commits', 'prCloseCommits', 'multiPrCommits', 'landedMerged', 'landedByPrClose', 'landedPullRequests',
  'issues', 'comments', 'reviewComments', 'activityPages', 'discussions', 'discussionComments', 'advisories',
] as const
export type Stats = Record<typeof STATS[number], number>
export const emptyStats = (): Stats => Object.fromEntries(STATS.map(key => [key, 0])) as Stats

/** What one run collected, from one or several repositories. */
export interface Collected {
  repos: string[]
  /** ISO date of the run: the rolling periods (30 days, 12 months) end there. */
  collectedAt: string
  since: string | null
  activity: boolean
  files: Map<Period, ContributorRecord[]>
  packages: PackagesRecord[]
  calendar: Calendar
  stats: Stats
}

/** Records as a data file: one JSON line each (`toJsonLines`). */
const writeLines = (dir: string, file: string, records: readonly unknown[]) => writeFile(join(dir, file), toJsonLines(records), 'utf8')

/** A `--part` run: its records, as the site's files would be, and what it collected. Empty records are fine. */
export async function writePart(dir: string, collected: Collected): Promise<void> {
  await mkdir(dir, { recursive: true })
  for (const [period, records] of collected.files) await writeLines(dir, periodFile(period), records)
  await writeLines(dir, PACKAGES_FILE, collected.packages)
  await writeCalendar(dir, collected.calendar)
  const { files, packages, calendar, ...part } = collected
  await writeFile(join(dir, PART_FILE), `${JSON.stringify({ ...part, periods: [...files.keys()] }, null, 2)}\n`, 'utf8')
  console.log(`Wrote the part of ${collected.repos.join(', ')} to ${dir} (${files.get('all')?.length ?? 0} contributors all time)`)
}

export async function readPart(dir: string): Promise<Collected> {
  const part = JSON.parse(await readFile(join(dir, PART_FILE), 'utf8')) as Omit<Collected, 'files' | 'packages' | 'calendar'> & { periods: Period[] }
  const files = new Map<Period, ContributorRecord[]>()
  for (const period of part.periods) files.set(period, JSON.parse(await readFile(join(dir, periodFile(period)), 'utf8')) as ContributorRecord[])
  const packages = JSON.parse(await readFile(join(dir, PACKAGES_FILE), 'utf8')) as PackagesRecord[]
  const encoded = JSON.parse(await readFile(join(dir, CALENDAR_FILE), 'utf8')) as Record<string, number[]>
  const calendar: Calendar = new Map(Object.entries(encoded).map(([githubId, days]) => [Number(githubId), decodeCalendar(days)]))
  const { periods: _periods, ...rest } = part
  return { ...rest, files, packages, calendar }
}

const writeCalendar = (dir: string, calendar: Calendar) => writeFile(join(dir, CALENDAR_FILE), `${JSON.stringify(encodeCalendar(calendar))}\n`, 'utf8')

/** Where a run gets the team and the profiles: GitHub, or fakes in tests. */
export interface Sources {
  team: (owners: string[]) => Promise<TeamRecord[]>
  profiles: (contributors: TeamRecord[]) => Promise<ProfileRecord[]>
}

/** What the previous run left in the data folder: who had which username, and the renames known so far. */
export interface Previous {
  contributors: TeamRecord[]
  renames: TeamRecord[]
}

/** A run that most likely broke (token, API): nothing is written, the previous files stay. */
export class RefusedRun extends Error {}

/** The site's data of a run, ready to write. */
export interface DataFiles {
  /** File name → records, in the order they are written. A file left out keeps the previous one. */
  files: Map<string, readonly unknown[]>
  meta: Record<string, unknown>
  /** The team or the profiles, when their source failed. */
  failures: Array<{ file: string, what: string, error: unknown }>
  /** What was written, printed before meta.json. */
  written: string[]
  /** Lines to check the run by, printed after meta.json. */
  checks: string[]
}

/** The period files, renames, packages, team and profiles, and meta.json of a run (`writeData` adds the calendar). Throws `RefusedRun`. */
export async function buildData(collected: Collected, previous: Previous, sources: Sources, options: { profiles: boolean }): Promise<DataFiles> {
  const { files: periods, stats } = collected
  const allTime = periods.get('all') ?? []
  if (!allTime.length) throw new RefusedRun('No contributors collected: refusing to write empty files. Check the token and API access.')
  if (!collected.since && allTime.length < MIN_FULL_RUN_CONTRIBUTORS) {
    throw new RefusedRun(`Only ${allTime.length} contributors in a full run (minimum ${MIN_FULL_RUN_CONTRIBUTORS}): refusing to write.`)
  }

  const files = new Map<string, readonly unknown[]>()
  const failures: DataFiles['failures'] = []
  const written: string[] = []
  const checks: string[] = []
  for (const [period, records] of periods) files.set(periodFile(period), records)
  written.push(`Wrote ${periods.size} period files (${allTime.length} contributors all time)`)

  // Renamed accounts: `/:oldname` and its card redirect to the new name. A test run's usernames are only a window.
  const renames = updatedRenames(previous.renames, collected.since ? [] : previous.contributors, allTime)
  files.set(RENAMES_FILE, renames)
  written.push(`Wrote ${renames.length} renamed usernames (${renames.length - previous.renames.length} new)`)

  // The packages each contributor's merged PRs named (`fix(router)`), all time.
  files.set(PACKAGES_FILE, collected.packages)
  written.push(`Wrote ${collected.packages.length} contributors' packages`)

  // Each contributor's contributions per day: the profile's graph.
  written.push(`Wrote ${collected.calendar.size} contributors' days`)

  // The public members of the organizations of the repositories: the "Angular team" badge.
  let team: number | null = null
  try {
    const records = await sources.team([...new Set(collected.repos.map(repo => repo.split('/')[0]!))])
    files.set(TEAM_FILE, records)
    team = records.length
    written.push(`Wrote ${records.length} public organization members`)
  }
  catch (error) {
    failures.push({ file: TEAM_FILE, what: 'Team members', error })
  }

  let profiles: number | null = null
  if (options.profiles) {
    try {
      const records = await sources.profiles(allTime.map(({ username, githubId }) => ({ username, githubId })))
      files.set(PROFILES_FILE, records)
      profiles = records.length
      written.push(`Wrote ${records.length} profiles (${records.filter(r => r.country).length} with a country)`)
    }
    catch (error) {
      // Profiles are a bonus: keep the previous file rather than publishing a partial one, still publish the stats.
      failures.push({ file: PROFILES_FILE, what: 'Profiles', error })
    }
  }

  const meta = {
    collectedAt: collected.collectedAt,
    repos: collected.repos,
    /** A test run with `--since`: all-time totals and first contributions only cover that window. */
    partial: collected.since !== null,
    since: collected.since,
    /** Issues, comments and review comments are in the scores. */
    activity: collected.activity,
    contributors: allTime.length,
    profiles,
    team,
    ...stats,
  }

  // Logins to check by hand for bots that `isBotAccount` does not catch yet: by name, and the busiest commenters.
  const suspects = allTime.filter(r => /bot|robot|automation|machine|\bci\b|release|sync|cla\b/i.test(r.username))
  checks.push(`Possible bots: ${suspects.length ? suspects.map(r => `${r.username} (${r.pullRequests.all} PRs, ${r.comments} comments)`).join(', ') : 'none'}`)
  if (collected.activity) {
    const commenters = [...allTime].sort((a, b) => b.comments + b.reviewComments - a.comments - a.reviewComments).slice(0, 20)
    checks.push(`Busiest commenters: ${commenters.map(r => `${r.username} ${r.comments}+${r.reviewComments}`).join(', ')}`)
  }
  checks.push(`Top 25: ${allTime.slice(0, 25).map(r => `${r.username} ${r.score}`).join(', ')}`)
  return { files, meta, failures, written, checks }
}

/** The site's data in `outputDir`, from `buildData`; a refused run exits with an error and writes nothing. */
export async function writeData(outputDir: string, collected: Collected, options: { profiles: boolean }): Promise<void> {
  let data: DataFiles
  try {
    data = await buildData(collected, await readPrevious(outputDir), { team: publicMembers, profiles: collectProfiles }, options)
  }
  catch (error) {
    if (!(error instanceof RefusedRun)) throw error
    console.error(error.message)
    process.exit(1)
  }

  await mkdir(outputDir, { recursive: true })
  for (const [file, records] of data.files) await writeLines(outputDir, file, records)
  await writeCalendar(outputDir, collected.calendar)
  for (const { file, what, error } of data.failures) {
    console.error(`${what} failed, ${existsSync(join(outputDir, file)) ? 'keeping the previous file' : `no ${file.replace('.json', '')} file`}:`, error instanceof Error ? error.message : error)
  }
  await writeFile(join(outputDir, META_FILE), `${JSON.stringify(data.meta, null, 2)}\n`, 'utf8')
  console.log(`Wrote the data to ${outputDir}`)
  for (const line of data.written) console.log(line)
  console.log(data.meta)
  for (const line of data.checks) console.log(line)
}

/** Before the new files replace them: the previous run's usernames and renames, none on the first run. */
async function readPrevious(dir: string): Promise<Previous> {
  return { contributors: await readRecords(dir, periodFile('all')), renames: await readRecords(dir, RENAMES_FILE) }
}

/** The GitHub ids and usernames of a data file, or none when it is missing or cannot be read. */
async function readRecords(dir: string, file: string): Promise<TeamRecord[]> {
  try {
    return await readDataFile(dir, file, parseUserIdsFile) ?? []
  }
  catch {
    return []
  }
}
