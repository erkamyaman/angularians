import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ContributorsAccumulator } from '@angularians/shared'
import { paginate } from '../src/github.ts'
import { collectAdvisories, fetchAdvisories } from '../src/advisories.ts'

vi.mock('../src/github.ts', () => ({ paginate: vi.fn(), retryTiming: { scale: 0 } }))

const user = (login: string, id: number) => ({ login, id, type: 'User' })
const npm = (name: string) => ({ package: { ecosystem: 'npm', name } })
const advisory = (ghsa: string, packages: string[], extra: Record<string, unknown> = {}) =>
  ({ ghsa_id: ghsa, published_at: '2026-05-01T00:00:00Z', withdrawn_at: null, vulnerabilities: packages.map(npm), ...extra })

async function* pages<T>(...lists: T[][]) {
  for (const list of lists) yield list
}

describe('collectAdvisories', () => {
  beforeEach(() => vi.mocked(paginate).mockReset())

  it('scores accepted Angular advisory roles from both lists, once per advisory', async () => {
    const eve = user('eve', 7)
    vi.mocked(paginate).mockImplementation(((url = '') => {
      if (url === '/repos/angular/angular/security-advisories?per_page=100&state=published') {
        return pages([
          advisory('GHSA-1', ['@angular/core'], { severity: 'high', credits_detailed: [{ type: 'reporter', user: eve, state: 'accepted' }, { type: 'remediation_developer', user: user('gus', 9), state: 'accepted' }] }),
          advisory('GHSA-2', ['@angular/core'], { credits_detailed: [{ type: 'finder', user: user('fay', 8), state: 'pending' }] }),
          advisory('GHSA-3', [], { credits_detailed: [{ type: 'reporter', user: user('devtools', 10), state: 'accepted' }] }),
        ])
      }
      if (url.startsWith('/advisories?')) {
        return pages([
          advisory('GHSA-1', ['@angular/core'], { severity: 'critical', credits: [{ type: 'reporter', user: eve }] }),
          advisory('GHSA-4', ['@nguniversal/common'], { severity: 'medium', credits: [{ type: 'finder', user: user('hal', 11) }] }),
          advisory('GHSA-5', ['angular'], { credits: [{ type: 'reporter', user: user('angularjs', 12) }] }),
          advisory('GHSA-6', ['@schematics/angular'], { withdrawn_at: '2026-06-01T00:00:00Z', credits: [{ type: 'reporter', user: user('ida', 13) }] }),
          advisory('GHSA-7', ['@angular/router'], { published_at: '2020-01-01T00:00:00Z', credits: [{ type: 'reporter', user: user('old', 14) }] }),
        ])
      }
      return pages([])
    }) as never)

    const accumulator = new ContributorsAccumulator(new Date('2026-06-01T00:00:00Z'))
    expect(await collectAdvisories(new Date('2026-01-01T00:00:00Z'), accumulator)).toEqual({ advisories: 3, credited: 2 })
    expect(accumulator.records().get('all')?.map(r => [r.username, r.advisories, r.score])).toEqual([['gus', 1, 90], ['eve', 1, 60], ['hal', 1, 40]])
    expect(accumulator.records().get('all')?.[0]?.advisoryCredits).toEqual({ remediation_developer: { high: 1 } })
    expect(accumulator.records().get('all')?.find(record => record.username === 'hal')?.advisoryCredits).toEqual({ finder: { moderate: 1 } })
  })

  it('fills missing repository severity from the global record and leaves absent severity unknown', async () => {
    vi.mocked(paginate).mockImplementation(((url = '') => {
      if (url === '/repos/angular/angular/security-advisories?per_page=100&state=published') {
        return pages([advisory('GHSA-filled', ['@angular/core'], { severity: null })])
      }
      if (url.startsWith('/advisories?')) return pages([
        advisory('GHSA-filled', ['@angular/core'], { severity: 'moderate' }),
        advisory('GHSA-unknown', ['@angular/core']),
      ])
      return pages([])
    }) as never)
    expect(await fetchAdvisories(null)).toMatchObject([
      { ghsa_id: 'GHSA-filled', severity: 'moderate' }, { ghsa_id: 'GHSA-unknown', severity: 'unknown' },
    ])
  })
})
