// Angular's security advisories and who reported them. Two lists, joined by GHSA id: the repositories' own advisories
// (most of them, with their credits), and GitHub's reviewed npm advisories of the packages (a few were filed only there).
import { ADVISORY_CREDITS, REPOS, type AdvisoryInput, type ContributorsAccumulator } from '@angularians/shared'
import { paginate } from './github.ts'

/** The packages whose advisories count. */
export const ANGULAR_PACKAGE = /^(?:@angular\/|@angular-devkit\/|@nguniversal\/|@schematics\/angular$)/

/** The packages to ask GitHub's npm advisories about: `affects` takes names, not a pattern. */
export const ADVISORY_PACKAGES: readonly string[] = [
  '@angular/animations', '@angular/build', '@angular/cdk', '@angular/cli', '@angular/common', '@angular/compiler',
  '@angular/compiler-cli', '@angular/core', '@angular/elements', '@angular/forms', '@angular/http', '@angular/language-service',
  '@angular/localize', '@angular/material', '@angular/platform-browser', '@angular/platform-browser-dynamic',
  '@angular/platform-server', '@angular/pwa', '@angular/router', '@angular/service-worker', '@angular/ssr', '@angular/upgrade',
  '@angular-devkit/architect', '@angular-devkit/build-angular', '@angular-devkit/build-webpack', '@angular-devkit/core',
  '@angular-devkit/schematics', '@nguniversal/builders', '@nguniversal/common', '@nguniversal/express-engine', '@schematics/angular',
]

interface Listed {
  ghsa_id: string
  published_at: string | null
  withdrawn_at: string | null
  vulnerabilities: Array<{ package: { ecosystem: string, name: string } | null }> | null
  /** On the global advisories. */
  credits?: AdvisoryInput['credits']
  /** On the repositories' advisories. */
  credits_detailed?: Array<AdvisoryInput['credits'][number] & { state?: string }>
}

/** The advisories of Angular's packages published since `since`, credits of both lists together. */
export async function fetchAdvisories(since: Date | null): Promise<AdvisoryInput[]> {
  const lists = [
    ...REPOS.map(repo => `/repos/${repo}/security-advisories?per_page=100&state=published`),
    `/advisories?${new URLSearchParams({ ecosystem: 'npm', per_page: '100', affects: ADVISORY_PACKAGES.join(',') })}`,
  ]
  const advisories = new Map<string, AdvisoryInput>()
  for (const list of lists) {
    for await (const page of paginate<Listed>(list)) {
      for (const item of page) {
        const angular = item.vulnerabilities?.some(v => v.package?.ecosystem === 'npm' && ANGULAR_PACKAGE.test(v.package.name))
        if (!angular || !item.published_at || item.withdrawn_at) continue
        if (since && Date.parse(item.published_at) < since.getTime()) continue
        const credits = item.credits_detailed?.filter(credit => credit.state === undefined || credit.state === 'accepted') ?? item.credits ?? []
        const known = advisories.get(item.ghsa_id)
        advisories.set(item.ghsa_id, { ghsa_id: item.ghsa_id, published_at: item.published_at, credits: [...known?.credits ?? [], ...credits] })
      }
    }
  }
  return [...advisories.values()]
}

/** Every advisory into the accumulator: returns how many there were, and how many credited a reporter. */
export async function collectAdvisories(since: Date | null, accumulator: ContributorsAccumulator): Promise<{ advisories: number, reported: number }> {
  const advisories = await fetchAdvisories(since)
  for (const advisory of advisories) accumulator.addAdvisory(advisory)
  return { advisories: advisories.length, reported: advisories.filter(a => a.credits.some(c => ADVISORY_CREDITS.includes(c.type))).length }
}
