import { countryName, countrySearchNames, periodPhrase, type Period } from '@angularians/shared'
import type { GithubColor } from './github-color'

const number = new Intl.NumberFormat('en-US')
const date = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' })
const month = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })

export const formatNumber = (value: number): string => number.format(value)
/** The word alone: `Merged PR` for 1, `Merged PRs` otherwise. */
export const pluralWord = (count: number, one: string, many: string): string => (count === 1 ? one : many)
export const plural = (count: number, one: string, many: string): string => `${number.format(count)} ${pluralWord(count, one, many)}`
export const formatPoints = (score: number): string => plural(score, 'pt', 'pts')
export const formatRank = (rank: number): string => `#${number.format(rank)}`
/** What the profile's stat cards and the Angularian card call each count: `[one, many]`. */
export const STAT_NAMES = {
  pullRequests: ['Merged PR', 'Merged PRs'],
  issues: ['Issue', 'Issues'],
  comments: ['Comment', 'Comments'],
  reactions: ['Reaction', 'Reactions'],
} as const satisfies Record<string, readonly [string, string]>
export type StatName = keyof typeof STAT_NAMES
/** `Merged PRs` for a stat's count, without the count. */
export const statWord = (stat: StatName, count: number): string => {
  const [one, many] = STAT_NAMES[stat]
  return pluralWord(count, one, many)
}
/** UTC, so the server and the browser print the same day (no hydration mismatch). */
export const formatDate = (iso: string): string => date.format(new Date(iso))
/** `Apr 2025`: "Angular contributor since …" on the profile, the signed-in card and the Angularian card. */
export const formatMonth = (iso: string): string => month.format(new Date(iso))

/**
 * A GitHub avatar by account id: stable across renames, served by GitHub's CDN.
 * `size` is in CSS pixels; GitHub gets twice that for 2x screens.
 */
export function avatarUrl(githubId: number, size: number): string {
  return `https://avatars.githubusercontent.com/u/${githubId}?s=${size * 2}&v=4`
}

/** The avatar at several widths: with `sizes`, the browser takes the smallest that fills its tile on that screen. */
export function avatarSrcset(githubId: number): string {
  return [64, 112, 160, 224].map(pixels => `${avatarUrl(githubId, pixels / 2)} ${pixels}w`).join(', ')
}

/** The profile opens on the period of the board it was picked from (all time is its default). */
export function profileQuery(period: Period, country: string | null = null): Record<string, string> {
  // The country only takes the profile's back link to the board it came from.
  return { ...(period === 'all' ? {} : { period }), ...(country ? { country } : {}) }
}

/** `?period=&flag=` of a profile or card link: all time and no flag leave it out. `extra` goes first (`?v=`). */
export function shareQuery(period?: Period, flag?: string | null, extra: Record<string, string> = {}): string {
  const params = new URLSearchParams({ ...extra, ...(period && period !== 'all' ? { period } : {}), ...(flag ? { flag } : {}) }).toString()
  return params ? `?${params}` : ''
}

type BoardCounts = { total: number, landedPullRequests: number, issues: number, comments: number, reviewComments: number }

/** A board's numbers in a sentence, for the shared board's description and its preview image. */
export function boardDescription(board: BoardCounts, period: Period): string {
  return `${plural(board.total, 'person', 'people')} contributed to Angular ${periodPhrase(period)}: ${plural(board.landedPullRequests, 'merged pull request', 'merged pull requests')}, ${plural(board.issues, 'issue', 'issues')} and ${plural(board.comments + board.reviewComments, 'comment', 'comments')}.`
}

/** The totals over a board, each in its GitHub colour (none for the people): `2,194` and `contributors from Germany`. */
export function boardTotals(board: BoardCounts & { country: string | null }): { icon: string, color: GithubColor | null, value: number, words: string }[] {
  const comments = board.comments + board.reviewComments
  const from = board.country ? ` from ${countryName(board.country)}` : ''
  return [
    { icon: 'remixGroupLine', color: null, value: board.total, words: pluralWord(board.total, 'contributor', 'contributors') + from },
    { icon: 'octGitMerge', color: 'purple', value: board.landedPullRequests, words: pluralWord(board.landedPullRequests, 'merged PR', 'merged PRs') },
    { icon: 'octIssueOpened', color: 'green', value: board.issues, words: pluralWord(board.issues, 'issue', 'issues') },
    { icon: 'octComment', color: 'blue', value: comments, words: pluralWord(comments, 'comment', 'comments') },
  ]
}

/** A round flag (circle-flags, copied to public/flags by scripts/copy-flags.ts). */
export function flagUrl(code: string): string {
  return `/flags/${code.toLowerCase()}.svg`
}

/** Whether a search matches a name, ignoring case and accents. */
export function matchesName(name: string, search: string): boolean {
  const plain = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase().replace(/ı/g, 'i')
  return plain(name).includes(plain(search))
}

/** Whether a search matches a country's English name, or another name people know it by. */
export function matchesCountry(code: string, search: string): boolean {
  return countrySearchNames(code).some(name => matchesName(name, search))
}
