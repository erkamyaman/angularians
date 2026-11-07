import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { emptyActivity, emptyCounts, score, type ContributorRecord } from '@angularians/shared'
import { emptyStats, readPart, writePart, type Collected } from '../src/finalize.ts'
import { mergeParts } from '../src/merge.ts'

const record = (githubId: number, username: string, fix: number): ContributorRecord => {
  const pullRequests = { ...emptyCounts(), fix, all: fix }
  return { githubId, username, score: score({ ...emptyActivity(), pullRequests }), pullRequests, ...emptyActivity(), firstContributionAt: null }
}
const part = (repo: string, collectedAt: string, records: ContributorRecord[], landed: number): Collected => ({
  repos: [repo],
  collectedAt,
  since: null,
  activity: true,
  files: new Map([['all', records], ['2026', records]]),
  packages: [{ githubId: records[0]!.githubId, packages: [{ name: repo === 'angular/angular' ? 'core' : '@angular/cdk', pullRequests: 1 }] }],
  calendar: new Map([[records[0]!.githubId, new Map([['2026-03-03', 2], ['2026-03-04', 1]])]]),
  stats: { ...emptyStats(), landedPullRequests: landed, comments: 2 },
})

let dirs: string[] = []
afterEach(async () => {
  await Promise.all(dirs.map(dir => rm(dir, { recursive: true, force: true })))
  dirs = []
})

describe('parts', () => {
  it('are written and read back as they were', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'part-'))
    dirs.push(dir)
    const written = part('angular/angular', '2026-11-04T03:17:00.000Z', [record(1, 'ann', 2)], 2)
    await writePart(dir, written)
    expect(await readPart(dir)).toEqual(written)
  })

  it('merge into one: records and packages per contributor, stats added up, the repositories in order', () => {
    const merged = mergeParts([
      part('angular/angular', '2026-11-04T03:17:05.000Z', [record(1, 'ann', 2), record(2, 'bob', 1)], 3),
      part('angular/components', '2026-11-04T03:17:01.000Z', [record(2, 'bob', 4)], 4),
    ])
    expect(merged.repos).toEqual(['angular/angular', 'angular/components'])
    expect(merged.collectedAt).toBe('2026-11-04T03:17:01.000Z')
    expect(merged.files.get('all')!.map(r => [r.username, r.pullRequests.all, r.score])).toEqual([['bob', 5, 25], ['ann', 2, 10]])
    expect([...merged.files.keys()]).toEqual(['all', '2026'])
    expect(merged.packages).toEqual([
      { githubId: 1, packages: [{ name: 'core', pullRequests: 1 }] },
      { githubId: 2, packages: [{ name: '@angular/cdk', pullRequests: 1 }] },
    ])
    expect(merged.calendar).toEqual(new Map([
      [1, new Map([['2026-03-03', 2], ['2026-03-04', 1]])],
      [2, new Map([['2026-03-03', 2], ['2026-03-04', 1]])],
    ]))
    expect(merged.stats).toMatchObject({ landedPullRequests: 7, comments: 4 })
  })

  it('of test runs merge, from the earliest start', () => {
    const test = (since: string) => ({ ...part('angular/angular', '2026-11-04T03:17:00.000Z', [record(1, 'ann', 1)], 1), since })
    expect(mergeParts([test('2026-10-28T03:17:09.000Z'), test('2026-10-28T03:17:02.000Z')]).since).toBe('2026-10-28T03:17:02.000Z')
  })

  it('refuse to merge a test run with a full one', () => {
    const test = { ...part('angular/components', '2026-11-04T03:17:00.000Z', [record(2, 'bob', 1)], 1), since: '2026-10-01T00:00:00.000Z' }
    expect(() => mergeParts([part('angular/angular', '2026-11-04T03:17:00.000Z', [record(1, 'ann', 1)], 1), test])).toThrow(/a full one/)
  })
})
