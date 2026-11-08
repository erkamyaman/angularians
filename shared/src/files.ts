// Ported from nuxt.com `shared/utils/nuxters.ts` (`parseNuxtersFile`, `parseNuxterProfilesFile`, `safeNuxterUrl`)
// and nuxt/nuxters `saveContributors` (MIT, Copyright (c) 2022-2023 NuxtLabs, Copyright (c) 2023 Nuxt).
import type { EncodedCalendar } from './calendar.ts'
import { countryCode } from './countries.ts'
import { ACTIVITY_KINDS, PULL_REQUEST_KINDS } from './kinds.ts'
import { ADVISORY_ROLE_POINTS, ADVISORY_SEVERITY_MULTIPLIERS, advisoryCount } from './advisory-scoring.ts'
import { compareRecords, emptyActivity, emptyCounts, score } from './scoring.ts'
import type { AdvisoryCreditCounts, AdvisoryRole, AdvisorySeverity, Contributor, DataMeta, PackagesRecord, ProfileRecord, SocialAccount, TeamRecord } from './types.ts'

/** GitHub's rule for a username: letters, digits and single hyphens between them, 39 characters at most. */
export const GITHUB_USERNAME_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i

/** The all-time profiles of the contributors: not a period. */
export const PROFILES_FILE = 'profiles.json'

/** One record per line: valid JSON, readable diffs, and about half the size of indented JSON. */
export function toJsonLines(records: readonly unknown[]): string {
  return `[\n${records.map(record => JSON.stringify(record)).join(',\n')}\n]\n`
}

function count(value: unknown): number {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? Math.round(number) : 0
}

function githubId(value: unknown): number | null {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

const MAX_TEXT_LENGTH = 200
/** GitHub logins are 39 characters at most. */
const MAX_LOGIN_LENGTH = 39
const MAX_SOCIAL_ACCOUNTS = 10

function text(value: unknown, max = MAX_TEXT_LENGTH): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null
}

/**
 * Validate a contributor file and rank it: score, then username.
 * The score is recomputed from the counts, so the file cannot rank anyone higher than what they did.
 * Invalid entries and duplicates are skipped, not fatal: one bad record must not block the import.
 */
export function parseContributorsFile(data: unknown): Contributor[] {
  if (!Array.isArray(data)) throw new TypeError('A contributors file must be an array')

  const contributors: Contributor[] = []
  const seen = new Set<number>()
  for (const entry of data) {
    if (!entry || typeof entry !== 'object') continue
    const record = entry as Record<string, unknown>
    const id = githubId(record['githubId'])
    const username = text(record['username'], MAX_LOGIN_LENGTH)
    if (id === null || !username || seen.has(id)) continue
    seen.add(id)

    const prs = (record['pullRequests'] && typeof record['pullRequests'] === 'object' ? record['pullRequests'] : {}) as Record<string, unknown>
    const pullRequests = emptyCounts()
    for (const kind of PULL_REQUEST_KINDS) {
      pullRequests[kind.key] = count(prs[kind.key])
      pullRequests.all += pullRequests[kind.key]
    }

    // v1 files (landed PRs only) have no activity: it reads as 0. A helpful count is never above its total.
    const activity = emptyActivity()
    for (const kind of ACTIVITY_KINDS) {
      if (kind.key === 'advisories') continue
      const amount = count(record[kind.key])
      activity[kind.key] = 'of' in kind ? Math.min(activity[kind.of], amount) : amount
    }
    const rawCredits = record['advisoryCredits']
    const advisoryCredits: AdvisoryCreditCounts | undefined = rawCredits && typeof rawCredits === 'object' && !Array.isArray(rawCredits) ? {} : undefined
    if (advisoryCredits) {
      for (const role of Object.keys(ADVISORY_ROLE_POINTS) as AdvisoryRole[]) {
        const rawSeverities = (rawCredits as Record<string, unknown>)[role]
        if (!rawSeverities || typeof rawSeverities !== 'object' || Array.isArray(rawSeverities)) continue
        for (const severity of Object.keys(ADVISORY_SEVERITY_MULTIPLIERS) as AdvisorySeverity[]) {
          const amount = count((rawSeverities as Record<string, unknown>)[severity])
          if (amount) (advisoryCredits[role] ??= {})[severity] = amount
        }
      }
    }
    activity.advisories = advisoryCount(advisoryCredits)

    const first = typeof record['firstContributionAt'] === 'string' ? new Date(record['firstContributionAt']) : null
    contributors.push({
      githubId: id,
      username,
      rank: 0,
      score: score({ pullRequests, ...activity, ...(advisoryCredits ? { advisoryCredits } : {}) }),
      pullRequests,
      ...activity,
      ...(advisoryCredits ? { advisoryCredits } : {}),
      firstContributionAt: first && !Number.isNaN(first.getTime()) ? first.toISOString() : null,
    })
  }

  contributors.sort(compareRecords)
  contributors.forEach((contributor, index) => {
    contributor.rank = index + 1
  })
  return contributors
}

/** An `http(s)` URL, normalized, or `null`: profile links are user input, rendered as `href`. */
export function safeUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048) return null
  try {
    const url = new URL(value.trim())
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  }
  catch {
    return null
  }
}

/**
 * Validate `profiles.json`. Invalid entries and links are skipped, not fatal, and so is a profile
 * left with no name, website, social account or country.
 */
export function parseProfilesFile(data: unknown): ProfileRecord[] {
  if (!Array.isArray(data)) throw new TypeError(`${PROFILES_FILE} must be an array`)

  const profiles: ProfileRecord[] = []
  const seen = new Set<number>()
  for (const entry of data) {
    if (!entry || typeof entry !== 'object') continue
    const record = entry as Record<string, unknown>
    const id = githubId(record['githubId'])
    const username = text(record['username'], MAX_LOGIN_LENGTH)
    if (id === null || !username || seen.has(id)) continue

    const socialAccounts: SocialAccount[] = []
    for (const account of Array.isArray(record['socialAccounts']) ? record['socialAccounts'] : []) {
      if (socialAccounts.length >= MAX_SOCIAL_ACCOUNTS) break
      if (!account || typeof account !== 'object') continue
      const { provider, url, displayName } = account as Record<string, unknown>
      const href = safeUrl(url)
      if (typeof provider !== 'string' || !/^[a-z]{1,32}$/.test(provider) || !href) continue
      socialAccounts.push({ provider, url: href, displayName: text(displayName) ?? href })
    }

    const name = text(record['name'])
    const website = safeUrl(record['website'])
    const country = countryCode(record['country'])
    if (!name && !website && !socialAccounts.length && !country) continue
    seen.add(id)
    profiles.push({ githubId: id, username, name, website, socialAccounts, country })
  }
  return profiles
}

/** The packages of every contributor, from `packages.json`. Invalid entries are skipped. */
export const PACKAGES_FILE = 'packages.json'
export const CALENDAR_FILE = 'calendar.json'
export function parsePackagesFile(data: unknown): PackagesRecord[] {
  if (!Array.isArray(data)) throw new TypeError(`${PACKAGES_FILE} must be an array`)
  const records: PackagesRecord[] = []
  for (const entry of data) {
    if (!entry || typeof entry !== 'object') continue
    const record = entry as Record<string, unknown>
    const id = githubId(record['githubId'])
    if (id === null || !Array.isArray(record['packages'])) continue
    const packages = record['packages'].flatMap((item: unknown) => {
      const { name, pullRequests } = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
      return typeof name === 'string' && /^(@[a-z0-9-]{1,40}\/)?[a-z0-9][a-z0-9.-]{0,40}$/.test(name) && count(pullRequests) ? [{ name, pullRequests: count(pullRequests) }] : []
    })
    if (packages.length) records.push({ githubId: id, packages })
  }
  return records
}

export function parseCalendarFile(data: unknown): EncodedCalendar {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new TypeError(`${CALENDAR_FILE} must be an object`)
  const people: EncodedCalendar = {}
  for (const [key, days] of Object.entries(data)) {
    const id = githubId(Number(key))
    if (id === null || !Array.isArray(days) || days.length % 2) continue
    const numbers = days as unknown[]
    const valid = numbers.every((value, i) => {
      if (typeof value !== 'number' || !Number.isSafeInteger(value)) return false
      if (i % 2) return value > 0
      return value >= 0 && (i === 0 || value > (numbers[i - 2] as number))
    })
    if (valid && days.length) people[id] = days as number[]
  }
  return people
}

/** The public members of the organization, from `team.json`. */
export const TEAM_FILE = 'team.json'
/** Old usernames of renamed contributors, by GitHub id: links to `/:oldname` and its card follow the person. */
export const RENAMES_FILE = 'renames.json'

/** Validate `team.json` or `renames.json`: GitHub ids and usernames. Invalid entries are skipped. */
export function parseUserIdsFile(data: unknown): TeamRecord[] {
  if (!Array.isArray(data)) throw new TypeError(`${TEAM_FILE} and ${RENAMES_FILE} must be arrays`)
  return data.flatMap((entry: unknown) => {
    const record = (entry && typeof entry === 'object' ? entry : {}) as Record<string, unknown>
    const id = githubId(record['githubId'])
    const username = text(record['username'], MAX_LOGIN_LENGTH)
    return id !== null && username ? [{ githubId: id, username }] : []
  })
}

/** When and what the collector collected. Its counts are for checking a run by hand: the site reads none of them. */
export const META_FILE = 'meta.json'
export function parseMetaFile(data: unknown): DataMeta {
  const meta = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>
  return {
    collectedAt: typeof meta['collectedAt'] === 'string' ? meta['collectedAt'] : null,
    partial: meta['partial'] === true,
    repos: Array.isArray(meta['repos']) ? meta['repos'].filter((repo): repo is string => typeof repo === 'string') : [],
  }
}

/**
 * The renames after a run: the known ones, and each contributor whose username differs from the previous run's,
 * by GitHub id (`previous` and `current`: the all-time records). An old name someone uses now is not a rename
 * any more: the person who has it wins. Sorted by username.
 */
export function updatedRenames(
  known: ReadonlyArray<{ githubId: number, username: string }>,
  previous: ReadonlyArray<{ githubId: number, username: string }>,
  current: ReadonlyArray<{ githubId: number, username: string }>,
): Array<{ githubId: number, username: string }> {
  const now = new Map(current.map(row => [row.githubId, row.username]))
  const taken = new Set(current.map(row => row.username.toLowerCase()))
  const renames = new Map<string, { githubId: number, username: string }>()
  for (const record of known) renames.set(record.username.toLowerCase(), record)
  for (const row of previous) {
    const name = now.get(row.githubId)
    if (name && name.toLowerCase() !== row.username.toLowerCase()) renames.set(row.username.toLowerCase(), { githubId: row.githubId, username: row.username })
  }
  return [...renames.entries()].filter(([name]) => !taken.has(name)).map(([, record]) => record)
    .sort((a, b) => a.username.toLowerCase().localeCompare(b.username.toLowerCase()))
}
