import { formatNumber } from './number-format'

/** The word alone: `Merged PR` for 1, `Merged PRs` otherwise. */
export const pluralWord = (count: number, one: string, many: string): string => (count === 1 ? one : many)
/** The count and its word: `1 person`, `2,194 people`. */
export const plural = (count: number, one: string, many: string): string => `${formatNumber(count)} ${pluralWord(count, one, many)}`
