import { describe, expect, it } from 'vitest'
import { emptyActivity, emptyCounts, score, type ContributorRecord } from '@angularians/shared'
import { buildData, emptyStats, RefusedRun, type Collected, type Sources } from '../src/finalize.ts'

const record = (githubId: number, username: string): ContributorRecord => {
  const pullRequests = { ...emptyCounts(), fix: 1, all: 1 }
  return { githubId, username, score: score({ ...emptyActivity(), pullRequests }), pullRequests, ...emptyActivity(), firstContributionAt: null }
}
const contributors = (count: number) => Array.from({ length: count }, (_, i) => record(i + 1, `user-${i + 1}`))
const collected = (records: ContributorRecord[], since: string | null = null): Collected => ({
  repos: ['angular/angular', 'angular/components'],
  collectedAt: '2026-11-07T10:01:50.861Z',
  since,
  activity: true,
  files: new Map([['all', records], ['2026', records]]),
  packages: [],
  calendar: new Map(),
  stats: { ...emptyStats(), landedPullRequests: records.length },
})
const sources: Sources = {
  team: async owners => owners.map((owner, i) => ({ githubId: 900_000 + i, username: `${owner}-member` })),
  profiles: async users => [{ githubId: users[0]!.githubId, username: users[0]!.username, name: 'First', website: null, socialAccounts: [], country: null }],
}
const nothingBefore = { contributors: [], renames: [] }

describe('buildData', () => {
  it('refuses an empty run, and a full run with fewer than 1,000 contributors', async () => {
    await expect(buildData(collected([]), nothingBefore, sources, { profiles: true })).rejects.toThrow(RefusedRun)
    await expect(buildData(collected(contributors(999)), nothingBefore, sources, { profiles: true })).rejects.toThrow(/Only 999 contributors/)
  })

  it('writes a test run of any size', async () => {
    const data = await buildData(collected(contributors(3), '2026-10-01T00:00:00.000Z'), nothingBefore, sources, { profiles: false })
    expect(data.files.get('contributors.json')).toHaveLength(3)
    expect(data.meta).toMatchObject({ partial: true, contributors: 3, profiles: null, team: 1 })
    expect(data.files.has('profiles.json')).toBe(false)
  })

  it('keeps the known renames and adds the usernames that changed since the previous run', async () => {
    const records = contributors(1000)
    const previous = { contributors: [{ githubId: 5, username: 'old-five' }, { githubId: 6, username: 'user-6' }], renames: [{ githubId: 7, username: 'older-seven' }] }
    const data = await buildData(collected(records), previous, sources, { profiles: true })
    expect(data.files.get('renames.json')).toEqual([{ githubId: 5, username: 'old-five' }, { githubId: 7, username: 'older-seven' }])
  })

  it('ignores the previous usernames in a test run: its contributors are only a window', async () => {
    const previous = { contributors: [{ githubId: 1, username: 'old-one' }], renames: [] }
    const data = await buildData(collected(contributors(3), '2026-10-01T00:00:00.000Z'), previous, sources, { profiles: true })
    expect(data.files.get('renames.json')).toEqual([])
  })

  it('writes every file and meta.json from the sources', async () => {
    const data = await buildData(collected(contributors(1000)), nothingBefore, sources, { profiles: true })
    expect([...data.files.keys()]).toEqual(['contributors.json', 'contributors-2026.json', 'renames.json', 'packages.json', 'team.json', 'profiles.json'])
    expect(data.files.get('team.json')).toEqual([{ githubId: 900_000, username: 'angular-member' }])
    expect(data.meta).toMatchObject({ repos: ['angular/angular', 'angular/components'], partial: false, contributors: 1000, profiles: 1, team: 1, landedPullRequests: 1000 })
    expect(data.failures).toEqual([])
  })

  it('leaves out a file whose source failed, so the previous one stays', async () => {
    const failing: Sources = { team: () => Promise.reject(new Error('API down')), profiles: () => Promise.reject(new Error('GraphQL down')) }
    const data = await buildData(collected(contributors(1000)), nothingBefore, failing, { profiles: true })
    expect(data.files.has('team.json') || data.files.has('profiles.json')).toBe(false)
    expect(data.meta).toMatchObject({ team: null, profiles: null })
    expect(data.failures.map(failure => failure.file)).toEqual(['team.json', 'profiles.json'])
  })
})
