const number = new Intl.NumberFormat('en-US')

export const formatNumber = (value: number): string => number.format(value)
export const formatPoints = (score: number): string => `${number.format(score)} ${score === 1 ? 'pt' : 'pts'}`
export const formatRank = (rank: number): string => `#${number.format(rank)}`
