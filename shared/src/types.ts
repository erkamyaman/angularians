/** The kind of a landed pull request, from its title (`feat(core): …`) or labels. */
export type PullRequestType = 'feat' | 'fix' | 'docs' | 'chore'

/** Landed pull requests by type. `all` is the sum of the four. */
export interface PullRequestCounts {
  feat: number
  fix: number
  docs: number
  chore: number
  all: number
}

/** `all`, `30d`, `12m`, or a year from 2014 (`'2025'`). */
export type Period = string

/** A GitHub account, as the API returns it on a pull request. */
export interface GitHubUser {
  login: string
  id: number
}

/** A pull request that landed in the repository, credited to its author. */
export interface LandedPullRequest {
  number: number
  author: GitHubUser
  type: PullRequestType
  /** The packages named in the title, `fix(router): …` → `['router']`. Empty without a scope. */
  scopes: string[]
  /** ISO date: GitHub's `merged_at`, or the date of its `PR Close #N` commit on the main branch. */
  landedAt: string
}

/** One line of `packages.json`: the packages a contributor's merged PRs touched, all time, most first. */
export interface PackagesRecord {
  githubId: number
  packages: Array<{ name: string, pullRequests: number }>
}

/** One line of `team.json`: a public member of the GitHub organization of the repository. */
export interface TeamRecord {
  githubId: number
  username: string
}

/**
 * One line of `contributors.json` (all time) or `contributors-<period>.json`, as the collector writes it.
 * Sorted by score, then username.
 */
export interface ContributorRecord extends ActivityCounts {
  githubId: number
  username: string
  score: number
  pullRequests: PullRequestCounts
  /** ISO date of the first counted contribution (landed PR, issue, comment or review comment). `null` when unknown. */
  firstContributionAt: string | null
}

/** What a contributor did besides landing PRs, in one period. */
export interface ActivityCounts {
  /** Issues opened (not PRs). */
  issues: number
  /** Of those: closed as completed, or 3+ reactions, or 5+ comments. */
  helpfulIssues: number
  /** Conversation comments on issues and PRs. */
  comments: number
  /** Of those: 3+ reactions. */
  helpfulComments: number
  /** Inline comments on the code of PRs. */
  reviewComments: number
  /** Received on the contributor's issues, PRs and comments, counted on the day of the item. */
  reactions: number
  /** Angular security advisories credited to them as reporter or finder. */
  advisories: number
}

/** A contributor's stats over one period, ranked. */
export interface Contributor extends ContributorRecord {
  rank: number
}

/** A contributor's stats over one period of their profile. */
export interface ContributorPeriodStats extends Omit<Contributor, 'githubId' | 'username' | 'firstContributionAt'> {
  period: Period
}

/** A link of a GitHub profile. */
export interface SocialAccount {
  /** `bluesky`, `twitter`, `linkedin`, `mastodon`, `youtube`, `npm`… or `generic` for any other URL. */
  provider: string
  url: string
  displayName: string
}

/** One line of `profiles.json`: what a contributor shows on their GitHub profile. */
export interface ProfileRecord {
  githubId: number
  username: string
  /** The GitHub display name, `null` when not set. */
  name: string | null
  website: string | null
  socialAccounts: SocialAccount[]
  /** ISO 3166-1 alpha-2 code, from the GitHub location. The location itself is not kept. */
  country: string | null
}

/** `/[username]`: all-time stats, plus every period the contributor contributed in. */
export interface ContributorProfile extends Contributor {
  periods: ContributorPeriodStats[]
  name: string | null
  website: string | null
  socialAccounts: SocialAccount[]
  country: string | null
  /** The packages the contributor's merged PRs named, all time, most first. */
  packages: Array<{ name: string, pullRequests: number }>
  /** A public member of the organization of the repository (the Angular team badge). */
  team: boolean
}

/** A leaderboard row. */
export interface ContributorSummary {
  githubId: number
  username: string
  /** The full name on the GitHub profile, on leaderboard rows when there is one. */
  name?: string
  rank: number
  /** The place within the country, on a leaderboard filtered on one. */
  countryRank?: number
  score: number
}

/** `/api/contributors`: one page of the leaderboard. */
export interface LeaderboardPage {
  period: Period
  /** The ISO country code the leaderboard is filtered on, `null` for everyone. */
  country: string | null
  /** The periods with data, in display order: rolling windows, all time, then years (newest first). */
  periods: Period[]
  /** Contributors in the period (and country). */
  total: number
  /** PRs landed in the period (and country). */
  landedPullRequests: number
  /** Issues, conversation comments and review comments made in the period (and country). */
  issues: number
  comments: number
  reviewComments: number
  items: ContributorSummary[]
  /** When the data was collected, ISO date. */
  collectedAt: string | null
}

/** The contributors of a country in a period: how many, and the best ranked ones. */
export interface CountryStats {
  /** ISO 3166-1 alpha-2 code */
  code: string
  count: number
  /** The 3 best ranked usernames */
  top: string[]
}

/** `/api/map/contributors`: the contributors of a period by country, from the most to the fewest. */
export interface ContributorsMap {
  period: Period
  /** Contributors in the period. */
  total: number
  /** The ones with a recognized country on their GitHub profile. */
  located: number
  countries: CountryStats[]
}
