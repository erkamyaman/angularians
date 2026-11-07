import type { CountryStats } from '@angularians/shared'

/** Each country's rank, from the most contributors: countries with the same count share a rank (1, 2, 2, 4). */
export function countryRanks(countries: readonly CountryStats[]): Map<string, number> {
  const firstAt = new Map<number, number>()
  return new Map(countries.map((item, index) => {
    if (!firstAt.has(item.count)) firstAt.set(item.count, index + 1)
    return [item.code, firstAt.get(item.count)!]
  }))
}
