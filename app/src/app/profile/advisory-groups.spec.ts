import { emptyActivity, emptyCounts, scoreBreakdown, type ScoredStats } from '@angularians/shared'
import { groupAdvisoryRoles } from './advisory-groups'

const rolesOf = (changes: Partial<ScoredStats>) => scoreBreakdown({ pullRequests: emptyCounts(), ...emptyActivity(), ...changes })
  .find(row => row.key === 'advisories')!.roles!

describe('groupAdvisoryRoles', () => {
  it('combines equal base weights and their severity counts without changing points', () => {
    const roles = rolesOf({
      advisories: 5,
      advisoryCredits: { finder: { low: 1 }, reporter: { high: 1 }, analyst: { high: 2 }, remediation_developer: { moderate: 1 } },
    })
    const before = structuredClone(roles)
    const groups = groupAdvisoryRoles(roles)
    expect(groups.map(group => [group.label, group.amount, group.points, group.total])).toEqual([
      ['Analyst / Remediation developer', 3, 30, 240], ['Finder / Reporter', 2, 20, 80],
    ])
    expect(groups[0]!.severities.map(row => [row.label, row.multiplier, row.amount, row.total])).toEqual([
      ['High', 3, 2, 180], ['Moderate', 2, 1, 60],
    ])
    expect(groups.reduce((total, group) => total + group.total, 0)).toBe(320)
    expect(roles).toEqual(before)
  })

  it('ignores obsolete aggregate-only advisory counts', () => {
    expect(groupAdvisoryRoles(rolesOf({ advisories: 3 }))).toEqual([])
  })

  it('groups other roles without exposing a long title and omits empty groups', () => {
    const groups = groupAdvisoryRoles(rolesOf({ advisories: 2, advisoryCredits: { tool: { critical: 1 }, coordinator: { critical: 1 } } }))
    expect(groups).toHaveLength(1)
    expect(groups[0]).toMatchObject({ label: 'Other credits', amount: 2, total: 10, points: 1 })
    expect(groupAdvisoryRoles([])).toEqual([])
  })
})
