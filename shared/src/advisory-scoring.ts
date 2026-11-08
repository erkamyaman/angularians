import type { AdvisoryCreditCounts, AdvisoryRole, AdvisorySeverity } from './types.ts'

export const ADVISORY_ROLE_POINTS: Readonly<Record<AdvisoryRole, number>> = {
  finder: 20, reporter: 20, analyst: 30, coordinator: 1, remediation_developer: 30,
  remediation_reviewer: 10, remediation_verifier: 1, tool: 1, sponsor: 1, other: 1,
}
export const ADVISORY_SEVERITY_MULTIPLIERS: Readonly<Record<AdvisorySeverity, number>> = {
  low: 1, moderate: 2, high: 3, critical: 5, unknown: 1,
}
const ROLE_LABELS: Readonly<Record<AdvisoryRole, string>> = {
  finder: 'Finder', reporter: 'Reporter', analyst: 'Analyst', coordinator: 'Coordinator',
  remediation_developer: 'Remediation developer', remediation_reviewer: 'Remediation reviewer',
  remediation_verifier: 'Remediation verifier', tool: 'Tool', sponsor: 'Sponsor', other: 'Other',
}
const SEVERITY_LABELS: Readonly<Record<AdvisorySeverity, string>> = {
  low: 'Low', moderate: 'Moderate', high: 'High', critical: 'Critical', unknown: 'Unspecified',
}
const ROLES = Object.keys(ADVISORY_ROLE_POINTS) as AdvisoryRole[]
const SEVERITIES = Object.keys(ADVISORY_SEVERITY_MULTIPLIERS) as AdvisorySeverity[]

interface AdvisoryStats {
  advisories: number
  advisoryCredits?: AdvisoryCreditCounts
}
export interface AdvisoryRoleBreakdown {
  role: AdvisoryRole
  label: string
  points: number
  amount: number
  total: number
  severities: Array<{ severity: AdvisorySeverity, label: string, multiplier: number, amount: number, total: number }>
}

export function normalizeAdvisorySeverity(value: unknown): AdvisorySeverity {
  return typeof value === 'string' && Object.hasOwn(ADVISORY_SEVERITY_MULTIPLIERS, value) ? value as AdvisorySeverity : 'unknown'
}

export function advisoryCount(credits: AdvisoryCreditCounts = {}): number {
  return ROLES.reduce((total, role) => total + SEVERITIES.reduce((sum, severity) => sum + (credits[role]?.[severity] ?? 0), 0), 0)
}

export function cloneAdvisoryCredits(credits: AdvisoryCreditCounts): AdvisoryCreditCounts {
  return Object.fromEntries(Object.entries(credits).map(([role, severities]) => [role, { ...severities }]))
}

/** Each bucket retains the pairing: a critical finder and a low developer have different weights. */
export function advisoryBreakdown(stats: AdvisoryStats): AdvisoryRoleBreakdown[] {
  const credits = stats.advisoryCredits ?? {}
  return ROLES.flatMap((role) => {
    if (!credits[role]) return []
    const severities = SEVERITIES.flatMap((severity) => {
      const amount = credits[role]?.[severity] ?? 0
      const multiplier = ADVISORY_SEVERITY_MULTIPLIERS[severity]
      return amount ? [{ severity, label: SEVERITY_LABELS[severity], multiplier, amount, total: amount * ADVISORY_ROLE_POINTS[role] * multiplier }] : []
    })
    const amount = severities.reduce((sum, severity) => sum + severity.amount, 0)
    return amount ? [{
      role, label: ROLE_LABELS[role], points: ADVISORY_ROLE_POINTS[role], amount,
      total: severities.reduce((sum, severity) => sum + severity.total, 0),
      severities,
    }] : []
  })
}

export function advisoryPoints(stats: AdvisoryStats): number {
  return advisoryBreakdown(stats).reduce((total, role) => total + role.total, 0)
}

/** Merge the paired credit counts and derive their total. */
export function addAdvisoryCounts(target: AdvisoryStats, source: AdvisoryStats): void {
  if (!target.advisoryCredits && !source.advisoryCredits) {
    target.advisories = 0
    return
  }
  const combined = cloneAdvisoryCredits(target.advisoryCredits ?? {})
  const incoming = source.advisoryCredits ?? {}
  for (const role of ROLES) {
    for (const severity of SEVERITIES) {
      const amount = incoming[role]?.[severity] ?? 0
      if (!amount) continue
      const counts = combined[role] ??= {}
      counts[severity] = (counts[severity] ?? 0) + amount
    }
  }
  target.advisoryCredits = combined
  target.advisories = advisoryCount(combined)
}
