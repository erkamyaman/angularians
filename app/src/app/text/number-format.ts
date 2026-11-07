const number = new Intl.NumberFormat('en-US')

export const formatNumber = (value: number): string => number.format(value)
/** The word alone: `Merged PR` for 1, `Merged PRs` otherwise. */
export const pluralWord = (count: number, one: string, many: string): string => (count === 1 ? one : many)
export const plural = (count: number, one: string, many: string): string => `${number.format(count)} ${pluralWord(count, one, many)}`
export const formatPoints = (score: number): string => plural(score, 'pt', 'pts')
export const formatRank = (rank: number): string => `#${number.format(rank)}`
