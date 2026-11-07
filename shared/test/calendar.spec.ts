import { describe, expect, it } from 'vitest'
import { decodeCalendar, encodeCalendar, mergeCalendars } from '../src/calendar.ts'

describe('mergeCalendars', () => {
  it('adds up each person-day across the parts of a run', () => {
    const repoA = new Map([[1, new Map([['2026-03-03', 2]])], [2, new Map([['2019-07-01', 1]])]])
    const repoB = new Map([[1, new Map([['2026-03-03', 1], ['2026-03-04', 4]])]])
    expect(mergeCalendars([repoA, repoB])).toEqual(new Map([
      [1, new Map([['2026-03-03', 3], ['2026-03-04', 4]])],
      [2, new Map([['2019-07-01', 1]])],
    ]))
  })
})

describe('encodeCalendar', () => {
  it('writes each person as day numbers from 1 January 2014 and counts, in day order', () => {
    const calendar = new Map([[7, new Map([['2014-01-02', 3], ['2014-01-01', 1], ['2016-03-01', 2]])]])
    expect(encodeCalendar(calendar)).toEqual({ 7: [0, 1, 1, 3, 790, 2] })
  })
})

describe('decodeCalendar', () => {
  it('reads one person back as days and counts', () => {
    expect(decodeCalendar([0, 1, 1, 3, 790, 2])).toEqual(new Map([['2014-01-01', 1], ['2014-01-02', 3], ['2016-03-01', 2]]))
  })
})
