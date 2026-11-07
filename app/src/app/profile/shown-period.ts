import type { Period } from '@angularians/shared'

/** `?period=` when the contributor contributed in it, all time otherwise. */
export function shownPeriod(requested: Period | null, available: readonly Period[]): Period {
  return requested && available.includes(requested) ? requested : 'all'
}

export function missingPeriod(requested: Period | null, available: readonly Period[]): Period | null {
  return requested && shownPeriod(requested, available) !== requested ? requested : null
}
