import { emptyActivity, emptyCounts, type ContributorProfile } from '@angularians/shared'
import { earnedBadges } from './earned-badges'

const person = (changes: Partial<ContributorProfile> = {}): ContributorProfile => ({
  githubId: 9999999999, username: 'new-researcher', rank: 100, score: 0,
  pullRequests: emptyCounts(), ...emptyActivity(), firstContributionAt: null,
  periods: [], name: null, website: null, socialAccounts: [], country: null, packages: [], team: false,
  calendar: [], collectedAt: null,
  ...changes,
})
const shieldwall = (profile: ContributorProfile) => earnedBadges(profile).find(badge => badge.label === 'Shieldwall')

describe('Shieldwall', () => {
  it('awards a newly collected recipient without adding their GitHub id to a list', () => {
    expect(shieldwall(person({ advisories: 1 }))).toMatchObject({
      title: 'Credited on 1 Angular security advisory',
      href: 'https://github.com/advisories?query=credit%3Anew-researcher',
      tone: 'shieldwall',
    })
  })

  it('uses the latest collected all-time count for the badge title', () => {
    expect(shieldwall(person({ advisories: 3 }))?.title).toBe('Credited on 3 Angular security advisories')
    expect(shieldwall(person({ advisories: 20 }))?.title).toBe('Credited on 20 Angular security advisories')
  })

  it('counts an AngularJS advisory, which the collector leaves out', () => {
    expect(shieldwall(person({ githubId: 128171, username: 'koto' }))?.title).toBe('Credited on 1 Angular security advisory')
  })

  it('does not award a formerly listed user when collected data has no credits', () => {
    expect(shieldwall(person({ githubId: 73321943, username: 'SkyZeroZx', advisories: 0 }))).toBeUndefined()
  })
})
