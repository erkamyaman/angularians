// Ported from nuxt.com `shared/utils/nuxters.ts` and nuxt/nuxters `scripts/collect-contributors.ts`
// (MIT, Copyright (c) 2022-2023 NuxtLabs, Copyright (c) 2023 Nuxt).
import type { Period } from './types.ts'

/** The first commits of angular/angular are from 2014. */
export const FIRST_YEAR = 2014
export const DEFAULT_PERIOD: Period = '12m'

const DAY_MS = 24 * 60 * 60 * 1000
/** Rolling windows ending at the collection time. */
export const ROLLING_WINDOWS = [
  ['30d', 30],
  ['12m', 365],
] as const satisfies ReadonlyArray<readonly [Period, number]>
const ROLLING_PERIODS: readonly Period[] = ROLLING_WINDOWS.map(([period]) => period)

const PERIOD_RE = /^(?:all|30d|12m|\d{4})$/
const FILE_RE = /^contributors(?:-(30d|12m|\d{4}))?\.json$/

/** `all`, `30d`, `12m`, or a year from 2014 to the current one (UTC). */
export function periodOrNull(value: unknown): Period | null {
  return isPeriod(value) ? value : null
}

export function isPeriod(value: unknown, now: Date = new Date()): value is Period {
  if (typeof value !== 'string' || !PERIOD_RE.test(value)) return false
  if (!/^\d{4}$/.test(value)) return true
  const year = Number(value)
  return year >= FIRST_YEAR && year <= now.getUTCFullYear()
}

/** Every period a collection run writes a file for: all time, the rolling windows, then each year. */
export function allPeriods(now: Date): Period[] {
  const periods: Period[] = ['all', ...ROLLING_PERIODS]
  for (let year = FIRST_YEAR; year <= now.getUTCFullYear(); year++) periods.push(`${year}`)
  return periods
}

/** The periods a contribution made at `date` counts in: always `all`, then its rolling windows and its year. */
export function periodsFor(date: string | null | undefined, now: Date): Period[] {
  const periods: Period[] = ['all']
  const time = date ? Date.parse(date) : Number.NaN
  if (Number.isNaN(time)) return periods
  for (const [period, days] of ROLLING_WINDOWS) {
    if (time >= now.getTime() - days * DAY_MS && time <= now.getTime()) periods.push(period)
  }
  const year = new Date(time).getUTCFullYear()
  if (year >= FIRST_YEAR) periods.push(`${year}`)
  return periods
}

/** `all` → `contributors.json`, `30d` → `contributors-30d.json`. */
export function periodFile(period: Period): string {
  return period === 'all' ? 'contributors.json' : `contributors-${period}.json`
}

/** `contributors-30d.json` → `30d`, `contributors.json` → `all`, anything else → `null`. */
export function periodFromFile(name: string, now: Date = new Date()): Period | null {
  const match = FILE_RE.exec(name)
  if (!match) return null
  const period = match[1] ?? 'all'
  return isPeriod(period, now) ? period : null
}

export function periodLabel(period: Period): string {
  if (period === '30d') return 'Last 30 days'
  if (period === '12m') return 'Last 12 months'
  if (period === 'all') return 'All time'
  return period
}

/** The period in a sentence: "in the last 30 days", "of all time", "in 2024". */
export function periodPhrase(period: Period): string {
  if (period === '30d') return 'in the last 30 days'
  if (period === '12m') return 'in the last 12 months'
  if (period === 'all') return 'of all time'
  return `in ${period}`
}

/** Rolling windows, all time, then years from the newest. Duplicates removed. */
export function sortPeriods(periods: Period[]): Period[] {
  const order = (period: Period) => {
    const rolling = ROLLING_PERIODS.indexOf(period)
    if (rolling !== -1) return rolling
    if (period === 'all') return ROLLING_PERIODS.length
    return ROLLING_PERIODS.length + 1 + (9999 - Number(period))
  }
  return [...new Set(periods)].sort((a, b) => order(a) - order(b))
}
