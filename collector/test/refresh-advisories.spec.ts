import { describe, expect, it } from 'vitest'
import { emptyActivity, emptyCounts, type AdvisoryInput, type ContributorRecord } from '@angularians/shared'
import { refreshAdvisoryRecords } from '../src/refresh-advisory-records.ts'

const now = new Date('2026-11-07T12:00:00Z')
const existing = (changes: Partial<ContributorRecord> = {}): ContributorRecord => ({
  githubId: 1, username: 'contributor', pullRequests: { ...emptyCounts(), fix: 2, all: 2 },
  ...emptyActivity(), score: 10, firstContributionAt: '2024-01-01T00:00:00Z', ...changes,
})
const advisory = (id: string, role: string, published_at = '2026-10-28T12:00:00Z', severity: string | null = null): AdvisoryInput => ({
  ghsa_id: id, published_at, severity, credits: [{ type: role, user: { id: 1, login: 'contributor' } }],
})

describe('refreshAdvisoryRecords', () => {
  it('fills missing credits from the collector without replacing other activity, and is idempotent', () => {
    const before = new Map([['all', [existing()]]])
    const advisories = [advisory('GHSA-one', 'finder'), advisory('GHSA-two', 'remediation_developer')]
    const refreshed = refreshAdvisoryRecords(before, advisories, now)
    expect(refreshed.get('all')?.[0]).toMatchObject({
      pullRequests: { fix: 2, all: 2 }, advisories: 2, advisoryCredits: { finder: { unknown: 1 }, remediation_developer: { unknown: 1 } },
      score: 60, firstContributionAt: '2024-01-01T00:00:00Z',
    })
    expect(refreshAdvisoryRecords(refreshed, advisories, now)).toEqual(refreshed)
    expect(before.get('all')?.[0]).toMatchObject({ advisories: 0, score: 10 })
  })

  it('replaces stale credits and uses the snapshot date for year and rolling periods', () => {
    const before = new Map([['all', [existing({ advisories: 7, score: 150 })]]])
    const refreshed = refreshAdvisoryRecords(before, [
      advisory('GHSA-recent', 'analyst'),
      advisory('GHSA-old', 'finder', '2025-01-01T00:00:00Z'),
    ], now)
    expect(refreshed.get('all')?.[0]).toMatchObject({ advisories: 2, score: 60 })
    expect(refreshed.get('30d')?.[0]).toMatchObject({ advisories: 1, advisoryCredits: { analyst: { unknown: 1 } }, score: 30 })
    expect(refreshed.get('2025')?.[0]).toMatchObject({ advisories: 1, advisoryCredits: { finder: { unknown: 1 } }, score: 20 })
  })

  it('drops withdrawn advisory-only rows and includes newly credited contributors', () => {
    const stale = existing({ githubId: 2, username: 'stale', pullRequests: emptyCounts(), advisories: 1, score: 20 })
    const refreshed = refreshAdvisoryRecords(new Map([['all', [stale]]]), [advisory('GHSA-new', 'reporter')], now)
    expect(refreshed.get('all')?.map(row => row.username)).toEqual(['contributor'])
    expect(refreshed.get('all')?.[0]).toMatchObject({ advisories: 1, score: 20 })
  })

  it('replaces stale severity buckets rather than adding new credits to them', () => {
    const before = new Map([['all', [existing({
      advisories: 1, advisoryCredits: { finder: { low: 1 } }, score: 30,
    })]]])
    const advisories = [advisory('GHSA-updated', 'finder', '2026-10-28T12:00:00Z', 'critical')]
    const after = refreshAdvisoryRecords(before, advisories, now)
    expect(after.get('all')?.[0]).toMatchObject({
      advisories: 1, advisoryCredits: { finder: { critical: 1 } }, score: 110,
    })
    expect(after.get('all')?.[0]?.advisoryCredits?.finder).toEqual({ critical: 1 })
    expect(refreshAdvisoryRecords(after, advisories, now)).toEqual(after)
  })
})
