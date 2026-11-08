import type { AdvisoryRole, ScoreRow } from '@angularians/shared'

type AdvisoryRoles = NonNullable<ScoreRow['roles']>
type SeverityRow = AdvisoryRoles[number]['severities'][number]

export interface AdvisoryGroup {
  label: string
  points: number
  amount: number
  total: number
  roles: Array<{ label: string, amount: number }>
  severities: SeverityRow[]
}

const OTHER_ROLES = new Set<AdvisoryRole>(['coordinator', 'remediation_verifier', 'tool', 'sponsor', 'other'])
const SEVERITY_ORDER = ['critical', 'high', 'moderate', 'low', 'unknown']

/** Equal base weights can share a summary without losing the role/severity pairing in the source. */
export function groupAdvisoryRoles(roles: AdvisoryRoles): AdvisoryGroup[] {
  const grouped = new Map<number, AdvisoryRoles>()
  for (const role of roles) {
    const group = grouped.get(role.points) ?? []
    group.push(role)
    grouped.set(role.points, group)
  }
  return [...grouped].map(([points, members]) => {
    const severities = new Map<string, SeverityRow>()
    for (const member of members) {
      for (const row of member.severities) {
        const existing = severities.get(row.severity)
        if (existing) {
          existing.amount += row.amount
          existing.total += row.total
        }
        else severities.set(row.severity, { ...row })
      }
    }
    return {
      label: members.every(member => OTHER_ROLES.has(member.role)) ? 'Other credits' : members.map(member => member.label).join(' / '),
      points,
      amount: members.reduce((sum, member) => sum + member.amount, 0),
      total: members.reduce((sum, member) => sum + member.total, 0),
      roles: members.map(member => ({ label: member.label, amount: member.amount })),
      severities: [...severities.values()].sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)),
    }
  }).sort((a, b) => b.total - a.total || b.points - a.points)
}
