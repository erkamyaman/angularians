import * as v from 'valibot'
import { ContributorInput, LeaderboardInput, MapInput, queryNumber, SearchInput } from './schemas'

describe('schemas', () => {
  it('defaults the leaderboard to the last 12 months, page 1, everyone', () => {
    expect(v.parse(LeaderboardInput, {})).toEqual({ period: '12m', country: null, page: 1 })
    expect(v.parse(LeaderboardInput, { period: '2016', country: 'tr', page: 3 })).toEqual({ period: '2016', country: 'TR', page: 3 })
  })

  it('rejects unknown periods, countries, pages and usernames', () => {
    for (const input of [{ period: '7d' }, { period: '2013' }, { country: 'XX' }, { page: 0 }, { page: 1.5 }, { page: '2' }]) {
      expect(v.safeParse(LeaderboardInput, input).success).toBe(false)
    }
    for (const username of ['', '-bob', 'bob-', 'a--b', 'a'.repeat(40), 'bob/../x', 'bob smith']) {
      expect(v.safeParse(ContributorInput, { username }).success).toBe(false)
    }
    expect(v.safeParse(ContributorInput, { username: 'Angular-Bob-2' }).success).toBe(true)
    expect(v.safeParse(MapInput, { period: 'week' }).success).toBe(false)
    expect(v.safeParse(SearchInput, { q: 'x'.repeat(101) }).success).toBe(false)
  })

  it('reads numbers from query strings, and nothing else', () => {
    expect(queryNumber('2')).toBe(2)
    expect(queryNumber('2.5')).toBe('2.5')
    expect(queryNumber('-1')).toBe('-1')
    expect(queryNumber(undefined)).toBeUndefined()
  })
})
