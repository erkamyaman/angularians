import { describe, expect, it } from 'vitest'
import { updatedRenames, parseContributorsFile, parsePackagesFile, parseProfilesFile, safeUrl, toJsonLines } from '../src/files.ts'

const record = (githubId: unknown, username: unknown, pullRequests: Record<string, unknown> = { feat: 1 }, extra: Record<string, unknown> = {}) =>
  ({ githubId, username, score: 999, pullRequests, firstContributionAt: '2020-01-01T00:00:00Z', ...extra })

describe('parseContributorsFile', () => {
  it('ranks by the recomputed score, then username, whatever the file says', () => {
    const rows = parseContributorsFile([
      record(1, 'zed', { fix: 1 }),
      record(2, 'amy', { fix: 1 }),
      record(3, 'top', { feat: 2 }),
    ])
    expect(rows.map(row => [row.rank, row.username, row.score])).toEqual([[1, 'top', 14], [2, 'amy', 5], [3, 'zed', 5]])
  })

  it('recomputes all from the four types and clamps bad counts to 0', () => {
    const [row] = parseContributorsFile([record(1, 'a', { feat: -3, fix: 'x', docs: 2.4, chore: 1, all: 999 })])
    expect(row?.pullRequests).toEqual({ feat: 0, fix: 0, docs: 2, chore: 1, all: 3 })
  })

  it('skips invalid and duplicate entries instead of failing', () => {
    const rows = parseContributorsFile([null, 'x', record(0, 'a'), record(1.5, 'b'), record(4, ''), record(4, 'ok'), record(4, 'dup'), record(5, 'x'.repeat(40))])
    expect(rows.map(row => row.username)).toEqual(['ok', 'x'.repeat(39)])
  })

  it('reads a missing or invalid first contribution date as null', () => {
    const rows = parseContributorsFile([record(1, 'a', {}, { firstContributionAt: 'nope' }), record(2, 'b', {}, { firstContributionAt: undefined })])
    expect(rows.map(row => row.firstContributionAt)).toEqual([null, null])
  })

  it('rejects a file that is not an array', () => {
    expect(() => parseContributorsFile({})).toThrow(TypeError)
  })
})

describe('parseProfilesFile', () => {
  const profile = (extra: Record<string, unknown>) => ({ githubId: 1, username: 'alice', name: null, website: null, socialAccounts: [], country: null, ...extra })

  it('keeps names, safe links and known countries', () => {
    expect(parseProfilesFile([profile({
      name: '  Alice  ',
      website: 'https://alice.dev',
      country: 'tr',
      socialAccounts: [
        { provider: 'bluesky', url: 'https://bsky.app/profile/alice', displayName: '@alice' },
        { provider: 'generic', url: 'javascript:alert(1)', displayName: 'x' },
        { provider: 'Bad Provider', url: 'https://example.com', displayName: 'x' },
      ],
    })])).toEqual([{
      githubId: 1,
      username: 'alice',
      name: 'Alice',
      website: 'https://alice.dev/',
      socialAccounts: [{ provider: 'bluesky', url: 'https://bsky.app/profile/alice', displayName: '@alice' }],
      country: 'TR',
    }])
  })

  it('drops profiles left with nothing to show, unknown countries and duplicates', () => {
    expect(parseProfilesFile([profile({ country: 'XX' }), profile({ website: 'ftp://x' })])).toEqual([])
    expect(parseProfilesFile([profile({ country: 'DE' }), profile({ country: 'FR' })]).map(p => p.country)).toEqual(['DE'])
  })
})

describe('safeUrl', () => {
  it('only keeps http(s) URLs', () => {
    expect(safeUrl('https://example.com')).toBe('https://example.com/')
    expect(safeUrl('http://example.com/a?b')).toBe('http://example.com/a?b')
    for (const value of ['javascript:alert(1)', 'data:text/html,x', 'example.com', '', 42, null, `https://${'a'.repeat(2050)}.com`]) {
      expect(safeUrl(value)).toBeNull()
    }
  })
})

describe('toJsonLines', () => {
  it('writes valid JSON, one record per line', () => {
    const text = toJsonLines([{ a: 1 }, { b: 2 }])
    expect(text).toBe('[\n{"a":1},\n{"b":2}\n]\n')
    expect(JSON.parse(text)).toEqual([{ a: 1 }, { b: 2 }])
  })
})

describe('parsePackagesFile', () => {
  it('keeps scopes and npm names, drops anything else', () => {
    expect(parsePackagesFile([
      { githubId: 1, packages: [
        { name: 'router', pullRequests: 2 },
        { name: '@angular/build', pullRequests: 3 },
        { name: '@schematics/angular', pullRequests: 1 },
        { name: '<script>', pullRequests: 1 },
        { name: '@a/b/c', pullRequests: 1 },
        { name: 'core', pullRequests: 0 },
      ] },
      { githubId: 2, packages: [{ name: 'Not Valid', pullRequests: 1 }] },
    ])).toEqual([{ githubId: 1, packages: [{ name: 'router', pullRequests: 2 }, { name: '@angular/build', pullRequests: 3 }, { name: '@schematics/angular', pullRequests: 1 }] }])
  })
})

describe('updatedRenames', () => {
  const row = (githubId: number, username: string) => ({ githubId, username })
  it('adds a contributor whose username changed, keeps the known ones, sorted', () => {
    expect(updatedRenames([row(9, 'zed-old')], [row(1, 'alice'), row(2, 'bob')], [row(1, 'alice'), row(2, 'robert'), row(9, 'zed')]))
      .toEqual([row(2, 'bob'), row(9, 'zed-old')])
  })
  it('ignores a change of case, and people who left the board', () => {
    expect(updatedRenames([], [row(1, 'Alice'), row(3, 'carol')], [row(1, 'alice')])).toEqual([])
  })
  it('drops an old name someone else contributes under now', () => {
    expect(updatedRenames([row(2, 'bob')], [], [row(2, 'robert'), row(5, 'bob')])).toEqual([])
  })
})
