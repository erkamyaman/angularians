// Weights and "helpful" rules ported from nuxt/nuxters `computeScore` and `addIssueStats`, breakdown from nuxt.com
// `nuxterScoreBreakdown` (MIT, Copyright (c) 2023 Nuxt, Copyright (c) 2022-2023 NuxtLabs).
// Differences: no core bonus (one repository), and inline review comments count too (1 point each).
import { isBotAccount } from './bots.ts'
import { allPeriods, periodsFor } from './periods.ts'
import type { ActivityCounts, ContributorRecord, GitHubUser, LandedPullRequest, PackagesRecord, Period, PullRequestCounts, PullRequestType } from './types.ts'

export const PULL_REQUEST_POINTS: Readonly<Record<PullRequestType, number>> = {
  feat: 7,
  fix: 5,
  docs: 4,
  chore: 3,
}

/** Points of everything besides landed PRs. */
export const ACTIVITY_POINTS: Readonly<Record<keyof ActivityCounts, number>> = {
  helpfulIssues: 3,
  helpfulComments: 2,
  issues: 1,
  reviewComments: 1,
  comments: 0.5,
  reactions: 0.1,
}

/** An issue is helpful when it was closed as completed, or got this many reactions or comments. */
export const HELPFUL_ISSUE_REACTIONS = 3
export const HELPFUL_ISSUE_COMMENTS = 5
/** A comment is helpful with this many reactions. */
export const HELPFUL_COMMENT_REACTIONS = 3

export const emptyCounts = (): PullRequestCounts => ({ feat: 0, fix: 0, docs: 0, chore: 0, all: 0 })
export const emptyActivity = (): ActivityCounts => ({ issues: 0, helpfulIssues: 0, comments: 0, helpfulComments: 0, reviewComments: 0, reactions: 0 })

export type ScoredStats = { pullRequests: PullRequestCounts } & ActivityCounts

/** The sum of every row of `scoreBreakdown`, rounded once (as Nuxters does). */
export function score(stats: ScoredStats): number {
  const prs = stats.pullRequests
  const total = prs.feat * PULL_REQUEST_POINTS.feat
    + prs.fix * PULL_REQUEST_POINTS.fix
    + prs.docs * PULL_REQUEST_POINTS.docs
    + prs.chore * PULL_REQUEST_POINTS.chore
    + stats.helpfulIssues * ACTIVITY_POINTS.helpfulIssues
    + stats.helpfulComments * ACTIVITY_POINTS.helpfulComments
    + stats.issues * ACTIVITY_POINTS.issues
    + stats.reviewComments * ACTIVITY_POINTS.reviewComments
    + stats.comments * ACTIVITY_POINTS.comments
    + stats.reactions * ACTIVITY_POINTS.reactions
  return Math.round(total)
}

export type ScoreRowKey = PullRequestType | keyof ActivityCounts

export interface ScoreRow {
  key: ScoreRowKey
  label: string
  /** A Lucide icon name (`@ng-icons/lucide`: `lucideRocket`…). */
  icon: string
  points: number
  amount: number
  /** amount × points, to one decimal. */
  total: number
}

const ROWS: ReadonlyArray<Pick<ScoreRow, 'key' | 'label' | 'icon'>> = [
  { key: 'feat', label: 'Feature PRs', icon: 'rocket' },
  { key: 'fix', label: 'Fix PRs', icon: 'wrench' },
  { key: 'docs', label: 'Docs PRs', icon: 'book-open' },
  { key: 'chore', label: 'Chore PRs', icon: 'brush-cleaning' },
  { key: 'helpfulIssues', label: 'Helpful issues', icon: 'lightbulb' },
  { key: 'helpfulComments', label: 'Helpful comments', icon: 'message-circle-heart' },
  { key: 'issues', label: 'Issues', icon: 'circle-dot' },
  { key: 'reviewComments', label: 'Review comments', icon: 'file-code' },
  { key: 'comments', label: 'Comments', icon: 'message-circle' },
  { key: 'reactions', label: 'Reactions received', icon: 'smile-plus' },
]

/** One row per contribution type, sorted by total (ties in the fixed order above). Rounded, the totals add up to the score. */
export function scoreBreakdown(stats: ScoredStats): ScoreRow[] {
  return ROWS
    .map((row) => {
      const isPr = row.key in PULL_REQUEST_POINTS
      const points = isPr ? PULL_REQUEST_POINTS[row.key as PullRequestType] : ACTIVITY_POINTS[row.key as keyof ActivityCounts]
      const amount = isPr ? stats.pullRequests[row.key as PullRequestType] : stats[row.key as keyof ActivityCounts]
      return { ...row, points, amount, total: Math.round(amount * points * 10) / 10 }
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

  /** Inline review comments: 1 point each, no "helpful" rule (they rarely get reactions). */
  addReviewComment(comment: CommentInput): void {
    const user = toUser(comment.user)
    if (!user) return
    this.add(user, comment.created_at, true, counts => (counts.reviewComments += 1))
  }

  /** `packages.json`: every contributor with a scoped PR, by GitHub id; each one's packages, most PRs first. */
  packages(): PackagesRecord[] {
    return [...this.packageCounts]
      .filter(([, packages]) => packages.size)
      .map(([githubId, packages]) => ({
        githubId,
        packages: [...packages].map(([name, pullRequests]) => ({ name, pullRequests })).sort((a, b) => b.pullRequests - a.pullRequests || a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.githubId - b.githubId)
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

/** Landed PRs only: the v1 entry point, kept for its callers and tests. */
export function buildContributorRecords(pulls: Iterable<LandedPullRequest>, now: Date): Map<Period, ContributorRecord[]> {
  const accumulator = new ContributorsAccumulator(now)
  for (const pull of pulls) accumulator.addLandedPullRequest(pull)
  return accumulator.records()
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
      for (const key of Object.keys(emptyActivity()) as Array<keyof ActivityCounts>) current[key] += record[key]
      for (const key of Object.keys(emptyCounts()) as Array<keyof PullRequestCounts>) current.pullRequests[key] += record.pullRequests[key]
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
  return [...merged]
    .map(([githubId, counts]) => ({
      githubId,
      packages: [...counts].map(([name, pullRequests]) => ({ name, pullRequests })).sort((a, b) => b.pullRequests - a.pullRequests || a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.githubId - b.githubId)
}
