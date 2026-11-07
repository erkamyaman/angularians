import { DAY_MS, FIRST_YEAR, utcDay } from './periods.ts'

export type Calendar = Map<number, Map<string, number>>
export type EncodedCalendar = Record<number, number[]>

export function mergeCalendars(calendars: readonly Calendar[]): Calendar {
  const merged: Calendar = new Map()
  for (const calendar of calendars) {
    for (const [githubId, days] of calendar) {
      let into = merged.get(githubId)
      if (!into) merged.set(githubId, (into = new Map()))
      for (const [day, count] of days) into.set(day, (into.get(day) ?? 0) + count)
    }
  }
  return merged
}

const EPOCH = Date.UTC(FIRST_YEAR, 0, 1)

export function encodeCalendar(calendar: Calendar): EncodedCalendar {
  const file: EncodedCalendar = {}
  for (const [githubId, days] of calendar) {
    file[githubId] = [...days]
      .map(([day, count]) => [Math.round((Date.parse(day) - EPOCH) / DAY_MS), count] as const)
      .sort((a, b) => a[0] - b[0])
      .flat()
  }
  return file
}

export function decodeCalendar(pairs: readonly number[]): Map<string, number> {
  const days = new Map<string, number>()
  for (let i = 0; i + 1 < pairs.length; i += 2) days.set(utcDay(EPOCH + pairs[i]! * DAY_MS), pairs[i + 1]!)
  return days
}
