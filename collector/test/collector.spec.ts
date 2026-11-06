import { describe, expect, it } from 'vitest'
import { parseCountryIndex } from '@angularians/shared'
import { parseGitLog } from '../src/commits.ts'
import { parseConfig, parseSince } from '../src/config.ts'
import { nextLink, retryDelay } from '../src/github.ts'
import { toProfileRecord, type GraphQLProfile } from '../src/profiles.ts'

describe('parseGitLog', () => {
  it('splits records on RS and the date from the message on NUL', () => {
    const output = '\x1e2025-01-02T03:04:05+01:00\x00fix: a\n\nPR Close #1\n\n\x1e2024-12-31T00:00:00Z\x00feat: b\n'
    expect(parseGitLog(output)).toEqual([
      { date: '2025-01-02T03:04:05+01:00', message: 'fix: a\n\nPR Close #1\n\n' },
      { date: '2024-12-31T00:00:00Z', message: 'feat: b\n' },
    ])
    expect(parseGitLog('')).toEqual([])
  })
})

describe('nextLink', () => {
  it('finds the next page', () => {
    const link = '<https://api.github.com/x?page=2>; rel="next", <https://api.github.com/x?page=9>; rel="last"'
    expect(nextLink(link)).toBe('https://api.github.com/x?page=2')
    expect(nextLink('<https://api.github.com/x?page=1>; rel="prev"')).toBeNull()
    expect(nextLink(null)).toBeNull()
  })
})

describe('retryDelay', () => {
  const now = 1_000_000_000_000
  it('waits for the rate limit reset, or Retry-After', () => {
    expect(retryDelay(403, new Headers({ 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(now / 1000 + 60) }), 1, now)).toBe(61_000)
    expect(retryDelay(429, new Headers({ 'retry-after': '30' }), 1, now)).toBe(30_000)
  })

  it('backs off on server errors and gives up on the rest', () => {
    expect(retryDelay(502, new Headers(), 2, now)).toBe(8000)
    expect(retryDelay(404, new Headers(), 1, now)).toBeNull()
    expect(retryDelay(422, new Headers(), 1, now)).toBeNull()
    // A 403 without rate-limit headers is a permission error, not a limit.
    expect(retryDelay(403, new Headers(), 1, now)).toBeNull()
  })
})

describe('parseConfig', () => {
  const now = new Date('2026-11-03T00:00:00Z')

  it('defaults to a full run of the Angular repositories from the REST API', () => {
    const config = parseConfig([], {}, now)
    expect(config).toMatchObject({ since: null, pulls: 'rest', activity: true, profiles: true, part: false })
    expect(config.repos.map(repo => `${repo.owner}/${repo.name}`)).toEqual(['angular/angular', 'angular/components', 'angular/angular-cli', 'angular/dev-infra', 'angular/domino'])
    expect(config.outputDir).toMatch(/data$/)
  })

  it('reads flags over env vars', () => {
    const config = parseConfig(['--since=90d', '--pulls=search', '--no-activity', '--no-profiles', '--repos=a/b,c/d'], { COLLECT_PULLS: 'rest' }, now)
    expect(config.since?.toISOString()).toBe('2026-08-05T00:00:00.000Z')
    expect(config).toMatchObject({ pulls: 'search', activity: false, profiles: false, repos: [{ owner: 'a', name: 'b' }, { owner: 'c', name: 'd' }] })
    expect(parseConfig([], { COLLECT_ACTIVITY: 'false' }, now).activity).toBe(false)
    expect(parseConfig([], { COLLECT_SINCE: '2026-01-01', COLLECT_PROFILES: 'false' }, now)).toMatchObject({ since: new Date('2026-01-01'), profiles: false })
  })

  it('rejects bad input', () => {
    expect(() => parseConfig(['--pulls=graphql'], {}, now)).toThrow()
    expect(() => parseConfig(['--nope'], {}, now)).toThrow()
    expect(() => parseConfig(['--repos=angular'], {}, now)).toThrow()
    expect(() => parseSince('soon', now)).toThrow()
  })
})

describe('toProfileRecord', () => {
  const countries = parseCountryIndex('TR\tTUR\t792\tTU\tTurkey', '')
  const user = (extra: Partial<NonNullable<GraphQLProfile>>): GraphQLProfile => ({
    databaseId: 1, login: 'alice', name: null, websiteUrl: null, twitterUsername: null, location: null, socialAccounts: { nodes: [] }, ...extra,
  })

  it('keeps links and the country, not the location', () => {
    expect(toProfileRecord(1, user({ name: ' Alice ', websiteUrl: 'alice.dev', twitterUsername: 'alice', location: 'Istanbul, Turkey' }), countries)).toEqual({
      githubId: 1,
      username: 'alice',
      name: 'Alice',
      website: 'https://alice.dev',
      socialAccounts: [{ provider: 'twitter', url: 'https://x.com/alice', displayName: '@alice' }],
      country: 'TR',
    })
  })

  it('drops a login now owned by another account, and profiles with nothing to show', () => {
    expect(toProfileRecord(2, user({ name: 'Alice' }), countries)).toBeNull()
    expect(toProfileRecord(1, user({ location: 'Mars' }), countries)).toBeNull()
    expect(toProfileRecord(1, null, countries)).toBeNull()
  })
})
