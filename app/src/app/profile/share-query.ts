import type { Period } from '@angularians/shared'

/** `?period=&flag=` of a profile or card link: all time and no flag leave it out. `extra` goes first (`?v=`). */
export function shareQuery(period?: Period, flag?: string | null, extra: Record<string, string> = {}): string {
  const params = new URLSearchParams({ ...extra, ...(period && period !== 'all' ? { period } : {}), ...(flag ? { flag } : {}) }).toString()
  return params ? `?${params}` : ''
}
