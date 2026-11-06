import { resolve } from 'node:path'
import { REPOS } from '@angularians/shared'
import { fileURLToPath } from 'node:url'

export interface Config {
  repos: Array<{ owner: string, name: string }>
  /** Only PRs closed and commits made since then: a test run, its files are marked partial. */
  since: Date | null
  pulls: 'rest' | 'search'
  /** Issues, conversation comments and inline review comments. Off: landed PRs only (as in v1). */
  activity: boolean
  /** Angular's security advisories, for their reporters. One run of the parts does it: the one of `REPOS[0]`. */
  advisories: boolean
  profiles: boolean
  outputDir: string
  cacheDir: string
  /** Write this run's repositories as a part for `merge.ts` (one job per repository), not the site's data. */
  part: boolean
}

/** The repositories on the board (`REPOS`). CI collects each in a job of its own (`--part`) and merges them (`merge.ts`). */
export const DEFAULT_REPOS = REPOS.join(',')

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const DAY_MS = 24 * 60 * 60 * 1000

/** `90d` → 90 days before `now`, `2026-08-01` → that day (UTC). */
export function parseSince(value: string, now = new Date()): Date {
  const days = /^(\d+)d$/.exec(value)
  const date = days ? new Date(now.getTime() - Number(days[1]) * DAY_MS) : new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid --since "${value}": use a date (2026-08-01) or days (90d)`)
  return date
}

export function parseRepos(value: string): Config['repos'] {
  return value.split(',').map(repo => repo.trim()).filter(Boolean).map((repo) => {
    const [owner, name, ...rest] = repo.split('/')
    if (!owner || !name || rest.length) throw new Error(`Invalid repository "${repo}", expected owner/name`)
    return { owner, name }
  })
}

/**
 * `node src/main.ts [--since=90d] [--pulls=rest|search] [--no-activity] [--no-advisories] [--no-profiles] [--out=dir] [--repos=a/b,c/d] [--part]`,
 * or the same as env vars: COLLECT_SINCE, COLLECT_PULLS, COLLECT_ACTIVITY=false, COLLECT_ADVISORIES=false, COLLECT_PROFILES=false,
 * CONTRIBUTORS_OUTPUT_DIR, COLLECT_REPOS.
 */
export function parseConfig(argv: string[], env: NodeJS.ProcessEnv, now = new Date()): Config {
  const flags = new Map<string, string>()
  for (const arg of argv) {
    // `pnpm collect -- --since=90d` can pass the `--` on.
    if (arg === '--') continue
    const match = /^--(no-)?([a-z-]+)(?:=(.*))?$/.exec(arg)
    if (!match) throw new Error(`Unknown argument "${arg}"`)
    flags.set(match[2]!, match[1] ? 'false' : match[3] ?? 'true')
  }
  const known = new Set(['since', 'pulls', 'activity', 'advisories', 'profiles', 'out', 'repos', 'part'])
  for (const flag of flags.keys()) if (!known.has(flag)) throw new Error(`Unknown flag --${flag}`)

  const pulls = flags.get('pulls') ?? env['COLLECT_PULLS'] ?? 'rest'
  if (pulls !== 'rest' && pulls !== 'search') throw new Error(`--pulls must be rest or search, not "${pulls}"`)
  const since = flags.get('since') ?? env['COLLECT_SINCE']
  const repos = parseRepos(flags.get('repos') ?? env['COLLECT_REPOS'] ?? DEFAULT_REPOS)
  const activity = (flags.get('activity') ?? env['COLLECT_ACTIVITY'] ?? 'true') !== 'false'
  const advisories = flags.get('advisories') ?? env['COLLECT_ADVISORIES']
  return {
    repos,
    since: since ? parseSince(since, now) : null,
    pulls,
    activity,
    advisories: advisories === undefined ? activity && repos.some(r => `${r.owner}/${r.name}` === REPOS[0]) : advisories !== 'false',
    profiles: (flags.get('profiles') ?? env['COLLECT_PROFILES'] ?? 'true') !== 'false',
    outputDir: resolve(flags.get('out') ?? env['CONTRIBUTORS_OUTPUT_DIR'] ?? `${ROOT}data`),
    cacheDir: resolve(env['COLLECT_CACHE_DIR'] ?? `${ROOT}.cache`),
    part: (flags.get('part') ?? 'false') !== 'false',
  }
}
