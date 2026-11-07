// Weights and "helpful" rules ported from nuxt/nuxters `computeScore` and `addIssueStats`, breakdown from nuxt.com
// `nuxterScoreBreakdown` (MIT, Copyright (c) 2023 Nuxt, Copyright (c) 2022-2023 NuxtLabs).
// Differences: no core bonus (one repository), and inline review comments count too (1 point each).
import { isBotAccount } from './bots.ts'
import { ACTIVITY_KINDS, KINDS, PULL_REQUEST_KINDS, type Kind, type PullRequestType } from './kinds.ts'
import { allPeriods, periodsFor } from './periods.ts'
import type { ActivityCounts, ContributorRecord, GitHubUser, LandedPullRequest, PackagesRecord, Period, PullRequestCounts } from './types.ts'

/** Points of a landed PR, by type. */
export const PULL_REQUEST_POINTS = Object.fromEntries(PULL_REQUEST_KINDS.map(kind => [kind.key, kind.points])) as Readonly<Record<PullRequestType, number>>

/** Points of everything besides landed PRs. */
export const ACTIVITY_POINTS = Object.fromEntries(ACTIVITY_KINDS.map(kind => [kind.key, kind.points])) as Readonly<Record<keyof ActivityCounts, number>>

/** The credits on a security advisory that score: reporting it. Fixing and reviewing it score as PRs and reviews. */
export const ADVISORY_CREDITS: readonly string[] = ['reporter', 'finder']

/** An issue is helpful when it was closed as completed, or got this many reactions or comments. */
export const HELPFUL_ISSUE_REACTIONS = 3
export const HELPFUL_ISSUE_COMMENTS = 5
/** A comment is helpful with this many reactions. */
export const HELPFUL_COMMENT_REACTIONS = 3

export const emptyCounts = (): PullRequestCounts => ({ ...zeros(PULL_REQUEST_KINDS), all: 0 })
export const emptyActivity = (): ActivityCounts => zeros(ACTIVITY_KINDS)

const zeros = <K extends string>(kinds: ReadonlyArray<{ key: K }>) => Object.fromEntries(kinds.map(kind => [kind.key, 0])) as Record<K, number>

export type ScoredStats = { pullRequests: PullRequestCounts } & ActivityCounts

/** How many of a kind the stats count. */
export const amountOf = (stats: ScoredStats, kind: Kind): number => kind.pullRequest ? stats.pullRequests[kind.key] : stats[kind.key]

/** The sum of every row of `scoreBreakdown`, rounded once (as Nuxters does). */
export function score(stats: ScoredStats): number {
  return Math.round(KINDS.reduce((total, kind) => total + amountOf(stats, kind) * kind.points, 0))
}

/** Adds every count of `source` to `target`, `all` included. */
export function addCounts(target: ScoredStats, source: ScoredStats): void {
  for (const kind of KINDS) {
    if (kind.pullRequest) target.pullRequests[kind.key] += source.pullRequests[kind.key]
    else target[kind.key] += source[kind.key]
  }
  target.pullRequests.all += source.pullRequests.all
}

export type ScoreRowKey = Kind['key']

export interface ScoreRow {
  key: ScoreRowKey
  label: string
  /** The kind's icon name (`rocket`…), which the profile's `score-breakdown.ts` maps to an icon. */
  icon: string
  points: number
  amount: number
  /** amount × points, to one decimal. */
  total: number
}

/** The rows' order when their totals tie: PRs, then by points, then in the order of `KINDS`. */
const ROW_ORDER: readonly Kind[] = [...KINDS].sort((a, b) => Number(b.pullRequest) - Number(a.pullRequest) || b.points - a.points)

/** One row per contribution type, sorted by total (ties in `ROW_ORDER`). Rounded, the totals add up to the score. */
export function scoreBreakdown(stats: ScoredStats): ScoreRow[] {
  return ROW_ORDER
    .map((kind) => {
      const amount = amountOf(stats, kind)
      return { key: kind.key, label: kind.label, icon: kind.icon, points: kind.points, amount, total: Math.round(amount * kind.points * 10) / 10 }
    })
    .sort((a, b) => b.total - a.total)
}

/** Score, then username: the order of every contributor file and of the leaderboard. */
export function compareRecords(a: Pick<ContributorRecord, 'score' | 'username'>, b: Pick<ContributorRecord, 'score' | 'username'>): number {
  return b.score - a.score || a.username.localeCompare(b.username)
}

/** An issue or a PR, as `GET /repos/{owner}/{repo}/issues?state=all` lists it, the fields used here. */
export interface IssueInput {
  user: { login?: string | null, id?: number | null, type?: string | null } | null
  created_at: string
  /** Present on PRs: they count for their reactions only (the PR itself counts when it lands). */
  pull_request?: object | null
  state_reason?: string | null
  comments?: number
  reactions?: { total_count?: number } | null
}

/** A conversation comment (`/issues/comments`) or an inline review comment (`/pulls/comments`). */
export interface CommentInput {
  user: { login?: string | null, id?: number | null, type?: string | null } | null
  created_at: string
  reactions?: { total_count?: number } | null
}

/** A GitHub security advisory of an Angular package, the fields used here. */
export interface AdvisoryInput {
  ghsa_id: string
  published_at: string
  credits: ReadonlyArray<{ type: string, user: IssueInput['user'] }>
}

type Counts = { pullRequests: PullRequestCounts } & ActivityCounts

/**
 * The contributor files of a collection run, built one event at a time (a full run streams ~500,000 comments).
 * Every event counts in all time, its rolling windows and its year, for its author; bots and deleted accounts are
 * left out. Contributors are keyed by GitHub id: a renamed account stays one person, under its latest login.
 */
export class ContributorsAccumulator {
  private readonly now: Date
  private readonly byPeriod: Map<Period, Map<number, Counts>>
  private readonly logins = new Map<number, { login: string, time: number }>()
  private readonly first = new Map<number, number>()
  /** GitHub id → package → merged PRs, all time. */
  private readonly packageCounts = new Map<number, Map<string, number>>()
  /** `GHSA id:GitHub id` of the advisories already counted. */
  private readonly advisories = new Set<string>()

  constructor(now: Date) {
    this.now = now
    this.byPeriod = new Map(allPeriods(now).map(period => [period, new Map()]))
  }

  addLandedPullRequest(pull: LandedPullRequest): void {
    let packages = this.packageCounts.get(pull.author.id)
    if (!packages) {
      packages = new Map()
      this.packageCounts.set(pull.author.id, packages)
    }
    for (const scope of pull.scopes ?? []) packages.set(scope, (packages.get(scope) ?? 0) + 1)
    this.add(pull.author, pull.landedAt, true, (counts) => {
      counts.pullRequests[pull.type] += 1
      counts.pullRequests.all += 1
    })
  }

  /** Issues count, with their reactions; PRs only for their reactions. */
  addIssue(issue: IssueInput): void {
    const user = toUser(issue.user)
    if (!user) return
    const reactions = issue.reactions?.total_count ?? 0
    if (issue.pull_request) {
      if (reactions) this.add(user, issue.created_at, false, counts => (counts.reactions += reactions))
      return
    }
    const helpful = issue.state_reason === 'completed' || reactions >= HELPFUL_ISSUE_REACTIONS || (issue.comments ?? 0) >= HELPFUL_ISSUE_COMMENTS
    this.add(user, issue.created_at, true, (counts) => {
      counts.issues += 1
      if (helpful) counts.helpfulIssues += 1
      counts.reactions += reactions
    })
  }

  addComment(comment: CommentInput): void {
    const user = toUser(comment.user)
    if (!user) return
    const reactions = comment.reactions?.total_count ?? 0
    this.add(user, comment.created_at, true, (counts) => {
      counts.comments += 1
      if (reactions >= HELPFUL_COMMENT_REACTIONS) counts.helpfulComments += 1
      counts.reactions += reactions
    })
  }

  /**
   * A discussion comment marked as the answer: a helpful comment, on top of the comment itself (`addComment`),
   * unless its reactions already made it one.
   */
  addAcceptedAnswer(comment: CommentInput): void {
    const user = toUser(comment.user)
    if (!user || (comment.reactions?.total_count ?? 0) >= HELPFUL_COMMENT_REACTIONS) return
    this.add(user, comment.created_at, false, counts => (counts.helpfulComments += 1))
  }

  /** Inline review comments: 1 point each, no "helpful" rule (they rarely get reactions). */
  addReviewComment(comment: CommentInput): void {
    const user = toUser(comment.user)
    if (!user) return
    this.add(user, comment.created_at, true, counts => (counts.reviewComments += 1))
  }

  /** A security advisory counts for each person credited as its reporter or finder, once per advisory. */
  addAdvisory(advisory: AdvisoryInput): void {
    for (const credit of advisory.credits) {
      const user = ADVISORY_CREDITS.includes(credit.type) ? toUser(credit.user) : null
      const key = `${advisory.ghsa_id}:${user?.id}`
      if (!user || this.advisories.has(key)) continue
      this.advisories.add(key)
      this.add(user, advisory.published_at, true, counts => (counts.advisories += 1))
    }
  }

  /** `packages.json`: every contributor with a scoped PR, by GitHub id; each one's packages, most PRs first. */
  packages(): PackagesRecord[] {
    return packagesRecords([...this.packageCounts].filter(([, packages]) => packages.size))
  }

  /** Every period, even an empty one, so readers can rely on its file. */
  records(): Map<Period, ContributorRecord[]> {
    const files = new Map<Period, ContributorRecord[]>()
    for (const [period, contributors] of this.byPeriod) {
      const records = [...contributors].map(([id, counts]): ContributorRecord => {
        const firstTime = this.first.get(id)
        return {
          githubId: id,
          username: this.logins.get(id)!.login,
          score: score(counts),
          ...counts,
          pullRequests: { ...counts.pullRequests },
          firstContributionAt: firstTime === undefined ? null : new Date(firstTime).toISOString(),
        }
      })
      files.set(period, records.sort(compareRecords))
    }
    return files
  }

  /** `contribution`: the event is a contribution of its own (reactions received are not). */
  private add(user: GitHubUser, date: string, contribution: boolean, update: (counts: Counts) => void): void {
    const time = Date.parse(date)
    const login = this.logins.get(user.id)
    if (!login || (!Number.isNaN(time) && time >= login.time)) this.logins.set(user.id, { login: user.login, time: Number.isNaN(time) ? -Infinity : time })
    if (contribution && !Number.isNaN(time) && time < (this.first.get(user.id) ?? Infinity)) this.first.set(user.id, time)
    for (const period of periodsFor(date, this.now)) {
      let contributors = this.byPeriod.get(period)
      if (!contributors) {
        contributors = new Map()
        this.byPeriod.set(period, contributors)
      }
      let counts = contributors.get(user.id)
      if (!counts) {
        counts = { pullRequests: emptyCounts(), ...emptyActivity() }
        contributors.set(user.id, counts)
      }
      update(counts)
    }
  }
}

function toUser(user: IssueInput['user']): GitHubUser | null {
  const login = user?.login
  const id = user?.id
  if (!login || typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0 || isBotAccount(login, user?.type)) return null
  return { login, id }
}

/**
 * One period's records of several repositories (each collected on its own) as one list: counts added up per
 * contributor, the score recomputed, the earliest first contribution kept, sorted as the collector sorts.
 */
export function mergeRecords(lists: ReadonlyArray<readonly ContributorRecord[]>): ContributorRecord[] {
  const merged = new Map<number, ContributorRecord>()
  for (const records of lists) {
    for (const record of records) {
      const current = merged.get(record.githubId)
      if (!current) {
        merged.set(record.githubId, { ...record, pullRequests: { ...record.pullRequests } })
        continue
      }
      addCounts(current, record)
      if (record.firstContributionAt && (!current.firstContributionAt || record.firstContributionAt < current.firstContributionAt)) {
        current.firstContributionAt = record.firstContributionAt
      }
    }
  }
  return [...merged.values()].map(record => ({ ...record, score: score(record) })).sort(compareRecords)
}

/** `packages.json` of several repositories as one: PRs added up per package (names are distinct across repositories). */
export function mergePackages(lists: ReadonlyArray<readonly PackagesRecord[]>): PackagesRecord[] {
  const merged = new Map<number, Map<string, number>>()
  for (const records of lists) {
    for (const { githubId, packages } of records) {
      let counts = merged.get(githubId)
      if (!counts) merged.set(githubId, (counts = new Map()))
      for (const { name, pullRequests } of packages) counts.set(name, (counts.get(name) ?? 0) + pullRequests)
    }
  }
  return packagesRecords([...merged])
}

/** `packages.json`'s records: by GitHub id, each one's packages most PRs first. */
function packagesRecords(counts: ReadonlyArray<[number, ReadonlyMap<string, number>]>): PackagesRecord[] {
  return counts
    .map(([githubId, packages]) => ({
      githubId,
      packages: [...packages].map(([name, pullRequests]) => ({ name, pullRequests })).sort((a, b) => b.pullRequests - a.pullRequests || a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.githubId - b.githubId)
}
