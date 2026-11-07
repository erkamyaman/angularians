import { pluralWord } from './plural'

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
