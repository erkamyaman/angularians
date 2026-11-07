import { describe, expect, it } from 'vitest'
import { allPeriods, isPeriod, periodDays, periodFile, periodFromFile, periodLabel, periodPhrase, periodsFor, sortPeriods } from '../src/periods.ts'

const now = new Date('2026-11-03T12:00:00Z')

describe('periods', () => {
  it('accepts all, the rolling windows and years from 2014 to the current one', () => {
    for (const period of ['all', '30d', '12m', '2014', '2026']) expect(isPeriod(period, now)).toBe(true)
    for (const period of ['2013', '2027', '7d', 'ALL', '', 2025, null]) expect(isPeriod(period, now)).toBe(false)
  })

  it('lists every period of a run', () => {
    const periods = allPeriods(now)
    expect(periods.slice(0, 4)).toEqual(['all', '30d', '12m', '2014'])
    expect(periods.at(-1)).toBe('2026')
    expect(periods).toHaveLength(3 + 13)
  })

  it('puts a date in all time, its rolling windows and its UTC year', () => {
    expect(periodsFor('2026-10-20T00:00:00Z', now)).toEqual(['all', '30d', '12m', '2026'])
    expect(periodsFor('2026-01-01T00:00:00Z', now)).toEqual(['all', '12m', '2026'])
    expect(periodsFor('2025-12-31T23:59:59Z', now)).toEqual(['all', '12m', '2025'])
    expect(periodsFor('2013-12-31T00:00:00Z', now)).toEqual(['all'])
    expect(periodsFor(null, now)).toEqual(['all'])
    expect(periodsFor('nope', now)).toEqual(['all'])
  })

  it('leaves dates after the run out of the rolling windows', () => {
    expect(periodsFor('2026-11-04T00:00:00Z', now)).toEqual(['all', '2026'])
  })

  it('maps file names to periods and back', () => {
    for (const period of ['all', '30d', '12m', '2014']) expect(periodFromFile(periodFile(period), now)).toBe(period)
    expect(periodFile('all')).toBe('contributors.json')
    expect(periodFromFile('contributors-2013.json', now)).toBeNull()
    expect(periodFromFile('profiles.json', now)).toBeNull()
  })

  it('orders rolling windows, all time, then years from the newest', () => {
    expect(sortPeriods(['2014', 'all', '2026', '12m', '30d', '2026'])).toEqual(['30d', '12m', 'all', '2026', '2014'])
  })

  it('labels each period and puts it in a sentence', () => {
    expect(['30d', '12m', 'all', '2024'].map(periodLabel)).toEqual(['Last 30 days', 'Last 12 months', 'All time', '2024'])
    expect(['30d', '12m', 'all', '2024'].map(periodPhrase)).toEqual(['in the last 30 days', 'in the last 12 months', 'of all time', 'in 2024'])
  })
})

describe('periodDays', () => {
  const at = new Date('2026-11-07T05:13:00Z')

  it('gives the UTC days a rolling window touches, from the day 365 days before the collection to its day', () => {
    expect(periodDays('12m', at)).toEqual(['2025-11-07', '2026-11-07'])
    expect(periodDays('30d', at)).toEqual(['2026-10-08', '2026-11-07'])
  })

  it('gives a past year whole, and the current one up to the collection', () => {
    expect(periodDays('2024', at)).toEqual(['2024-01-01', '2024-12-31'])
    expect(periodDays('2026', at)).toEqual(['2026-01-01', '2026-11-07'])
  })
})
