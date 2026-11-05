import { countrySearchNames, periodPhrase, type Period } from '@angularians/shared'

const number = new Intl.NumberFormat('en-US')
const date = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' })

export const formatNumber = (value: number): string => number.format(value)
export const formatPoints = (score: number): string => `${number.format(score)} ${score === 1 ? 'pt' : 'pts'}`
export const plural = (count: number, one: string, many: string): string => `${number.format(count)} ${count === 1 ? one : many}`
/** UTC, so the server and the browser print the same day (no hydration mismatch). */
export const formatDate = (iso: string): string => date.format(new Date(iso))

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

/** A board's numbers in a sentence, for the shared board's description and its preview image. */
export function boardDescription(board: { total: number, landedPullRequests: number, issues: number, comments: number, reviewComments: number }, period: Period): string {
  return `${plural(board.total, 'person', 'people')} contributed to Angular ${periodPhrase(period)}: ${plural(board.landedPullRequests, 'merged pull request', 'merged pull requests')}, ${plural(board.issues, 'issue', 'issues')} and ${plural(board.comments + board.reviewComments, 'comment', 'comments')}.`
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
