import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  PACKAGES_FILE,
  periodFile,
  parseRenamesFile,
  parseTeamFile,
  PROFILES_FILE,
  RENAMES_FILE,
  TEAM_FILE,
  toJsonLines,
  updatedRenames,
  type ContributorRecord,
  type PackagesRecord,
  type Period,
  type TeamRecord,
} from '@angularians/shared'
import { paginate } from './github.ts'
import { collectProfiles } from './profiles.ts'

/** Below this, a full run is most likely broken (token, API): keep the previous files. */
const MIN_FULL_RUN_CONTRIBUTORS = 1000
export const META_FILE = 'meta.json'
/** What a `--part` run writes besides its period files and packages.json: what `merge.ts` needs to finish. */
export const PART_FILE = 'part.json'

export type Stats = Record<
  'pulls' | 'commits' | 'prCloseCommits' | 'multiPrCommits' | 'landedMerged' | 'landedByPrClose' | 'landedPullRequests'
  | 'issues' | 'comments' | 'reviewComments' | 'activityPages' | 'discussions' | 'discussionComments' | 'advisories',
  number
>
export const emptyStats = (): Stats => ({
  pulls: 0, commits: 0, prCloseCommits: 0, multiPrCommits: 0, landedMerged: 0, landedByPrClose: 0, landedPullRequests: 0,
  issues: 0, comments: 0, reviewComments: 0, activityPages: 0, discussions: 0, discussionComments: 0, advisories: 0,
})

/** What one run collected, from one or several repositories. */
export interface Collected {
  repos: string[]
  /** ISO date of the run: the rolling periods (30 days, 12 months) end there. */
  collectedAt: string
  since: string | null
  activity: boolean
  files: Map<Period, ContributorRecord[]>
  packages: PackagesRecord[]
  stats: Stats
}

/** Records as a data file: one JSON line each (`toJsonLines`). */
const writeLines = (dir: string, file: string, records: readonly unknown[]) => writeFile(join(dir, file), toJsonLines(records), 'utf8')

/** A `--part` run: its records, as the site's files would be, and what it collected. Empty records are fine. */
export async function writePart(dir: string, collected: Collected): Promise<void> {
  await mkdir(dir, { recursive: true })
  for (const [period, records] of collected.files) await writeLines(dir, periodFile(period), records)
  await writeLines(dir, PACKAGES_FILE, collected.packages)
  const { files, packages, ...part } = collected
  await writeFile(join(dir, PART_FILE), `${JSON.stringify({ ...part, periods: [...files.keys()] }, null, 2)}\n`, 'utf8')
  console.log(`Wrote the part of ${collected.repos.join(', ')} to ${dir} (${files.get('all')?.length ?? 0} contributors all time)`)
}

export async function readPart(dir: string): Promise<Collected> {
  const part = JSON.parse(await readFile(join(dir, PART_FILE), 'utf8')) as Omit<Collected, 'files' | 'packages'> & { periods: Period[] }
  const files = new Map<Period, ContributorRecord[]>()
  for (const period of part.periods) files.set(period, JSON.parse(await readFile(join(dir, periodFile(period)), 'utf8')) as ContributorRecord[])
  const packages = JSON.parse(await readFile(join(dir, PACKAGES_FILE), 'utf8')) as PackagesRecord[]
  const { periods: _periods, ...rest } = part
  return { ...rest, files, packages }
}

/** The site's data: the period files, packages, team and profiles, and meta.json; then lines to check the run by. */
export async function writeData(outputDir: string, collected: Collected, options: { profiles: boolean }): Promise<void> {
  const { files, stats } = collected
  const allTime = files.get('all') ?? []
  if (!allTime.length) {
    console.error('No contributors collected: refusing to write empty files. Check the token and API access.')
    process.exit(1)
  }
  if (!collected.since && allTime.length < MIN_FULL_RUN_CONTRIBUTORS) {
    console.error(`Only ${allTime.length} contributors in a full run (minimum ${MIN_FULL_RUN_CONTRIBUTORS}): refusing to write.`)
    process.exit(1)
  }

  await mkdir(outputDir, { recursive: true })
  // Before the new files replace them: who had which username last time, and the renames known so far.
  const previous = collected.since ? [] : await readRecords(join(outputDir, periodFile('all')), parseTeamFile)
  const knownRenames = await readRecords(join(outputDir, RENAMES_FILE), parseRenamesFile)
  for (const [period, records] of files) await writeLines(outputDir, periodFile(period), records)
  console.log(`Wrote ${files.size} period files to ${outputDir} (${allTime.length} contributors all time)`)

  // Renamed accounts: `/:oldname` and its card redirect to the new name.
  const renames = updatedRenames(knownRenames, previous, allTime)
  await writeLines(outputDir, RENAMES_FILE, renames)
  console.log(`Wrote ${renames.length} renamed usernames (${renames.length - knownRenames.length} new)`)

  // The packages each contributor's merged PRs named (`fix(router)`), all time.
  await writeLines(outputDir, PACKAGES_FILE, collected.packages)
  console.log(`Wrote ${collected.packages.length} contributors' packages`)

  // The public members of the organizations of the repositories: the "Angular team" badge.
  let team: number | null = null
  try {
    const members = new Map<number, TeamRecord>()
    for (const owner of new Set(collected.repos.map(repo => repo.split('/')[0]!))) {
      for await (const page of paginate<{ login: string, id: number }>(`/orgs/${owner}/public_members?per_page=100`)) {
        for (const member of page) members.set(member.id, { githubId: member.id, username: member.login })
      }
    }
    const records = [...members.values()].sort((a, b) => a.githubId - b.githubId)
    await writeLines(outputDir, TEAM_FILE, records)
    team = records.length
    console.log(`Wrote ${records.length} public organization members`)
  }
  catch (error) {
    console.error(`Team members failed, ${existsSync(join(outputDir, TEAM_FILE)) ? 'keeping the previous file' : 'no team file'}:`, error instanceof Error ? error.message : error)
  }

  let profiles: number | null = null
  if (options.profiles) {
    try {
      const records = await collectProfiles(allTime.map(({ username, githubId }) => ({ username, githubId })))
      await writeLines(outputDir, PROFILES_FILE, records)
      profiles = records.length
      console.log(`Wrote ${records.length} profiles (${records.filter(r => r.country).length} with a country)`)
    }
    catch (error) {
      // Profiles are a bonus: keep the previous file rather than publishing a partial one, still publish the stats.
      console.error(`Profiles failed, ${existsSync(join(outputDir, PROFILES_FILE)) ? 'keeping the previous file' : 'no profiles file'}:`, error instanceof Error ? error.message : error)
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
  await writeFile(join(outputDir, META_FILE), `${JSON.stringify(meta, null, 2)}\n`, 'utf8')
  console.log(meta)

  // Logins to check by hand for bots that `isBotAccount` does not catch yet: by name, and the busiest commenters.
  const suspects = allTime.filter(r => /bot|robot|automation|machine|\bci\b|release|sync|cla\b/i.test(r.username))
  console.log('Possible bots:', suspects.length ? suspects.map(r => `${r.username} (${r.pullRequests.all} PRs, ${r.comments} comments)`).join(', ') : 'none')
  if (collected.activity) {
    const commenters = [...allTime].sort((a, b) => b.comments + b.reviewComments - a.comments - a.reviewComments).slice(0, 20)
    console.log('Busiest commenters:', commenters.map(r => `${r.username} ${r.comments}+${r.reviewComments}`).join(', '))
  }
  console.log('Top 25:', allTime.slice(0, 25).map(r => `${r.username} ${r.score}`).join(', '))
}

/** A data file's records, or none when it is missing or cannot be read (the first run, a test run). */
async function readRecords<T>(path: string, parse: (data: unknown) => T[]): Promise<T[]> {
  if (!existsSync(path)) return []
  try {
    return parse(JSON.parse(await readFile(path, 'utf8')))
  }
  catch {
    return []
  }
}
