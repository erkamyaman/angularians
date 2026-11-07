import type { Period } from '@angularians/shared'

/** The profile opens on the period of the board it was picked from (all time is its default). */
export function profileQuery(period: Period, country: string | null = null): Record<string, string> {
  // The country only takes the profile's back link to the board it came from.
  return { ...(period === 'all' ? {} : { period }), ...(country ? { country } : {}) }
}
