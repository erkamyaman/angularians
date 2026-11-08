import { describe, expect, it } from 'vitest'
import { advisoryPoints, ContributorsAccumulator, emptyActivity, emptyCounts, mergePackages, mergeRecords, score, scoreBreakdown, type CommentInput, type IssueInput } from '../src/scoring.ts'
import type { ContributorRecord, LandedPullRequest, PullRequestType } from '../src/types.ts'

const stats = (prs: Partial<Record<PullRequestType, number>>, activity: Partial<ReturnType<typeof emptyActivity>> = {}) => {
  const pullRequests = { ...emptyCounts(), ...prs }
  pullRequests.all = pullRequests.feat + pullRequests.fix + pullRequests.docs + pullRequests.chore
  return { pullRequests, ...emptyActivity(), ...activity }
}

describe('score', () => {
  it('weighs landed PRs like Nuxters: feat 7, fix 5, docs 4, chore 3', () => {
    expect(score(stats({ feat: 1 }))).toBe(7)
    expect(score(stats({ feat: 2, fix: 3, docs: 4, chore: 5 }))).toBe(14 + 15 + 16 + 15)
  })

  it('weighs the rest like Nuxters, review comments at 1, and rounds the sum once', () => {
    expect(score(stats({}, { helpfulIssues: 1, issues: 1 }))).toBe(4)
    expect(score(stats({}, { helpfulComments: 1, comments: 1 }))).toBe(3) // 2 + 0.5 = 2.5 → 3
    expect(score(stats({}, { reviewComments: 3 }))).toBe(3)
    expect(score(stats({}, { comments: 3, reactions: 4 }))).toBe(2) // 1.5 + 0.4 = 1.9 → 2
    expect(score(stats({}, { reactions: 4 }))).toBe(0)
  })

  it('does not score an advisory counter without paired credits', () => {
    expect(score(stats({ fix: 1 }, { advisories: 2 }))).toBe(5)
  })

  it('scores every advisory role by its weight, with one credited advisory counted once', () => {
    const counts = { ...stats({}), advisories: 20, advisoryCredits: { finder: { unknown: 5 }, reporter: { unknown: 2 }, remediation_developer: { unknown: 12 }, analyst: { unknown: 1 } } }
    expect(score(counts)).toBe(530)
    expect(scoreBreakdown(counts).find(row => row.key === 'advisories')).toMatchObject({
      amount: 20, points: null, total: 530,
      roles: [
        { role: 'finder', amount: 5, points: 20, total: 100 },
        { role: 'reporter', amount: 2, points: 20, total: 40 },
        { role: 'analyst', amount: 1, points: 30, total: 30 },
        { role: 'remediation_developer', amount: 12, points: 30, total: 360 },
      ],
    })
  })

  it.each([
    ['finder', 20], ['reporter', 20], ['analyst', 30], ['remediation_developer', 30],
    ['remediation_reviewer', 10], ['coordinator', 1], ['remediation_verifier', 1],
    ['tool', 1], ['sponsor', 1], ['other', 1],
  ] as const)('awards %s advisory credits %i points', (role, points) => {
    expect(score({ ...stats({}), advisories: 1, advisoryCredits: { [role]: { unknown: 1 } } })).toBe(points)
  })
})

describe('scoreBreakdown', () => {
  it('has one row per type, sorted by total, adding up to the score', () => {
    const counts = stats({ feat: 1, docs: 3, chore: 1 }, { issues: 2, helpfulIssues: 1, comments: 7, helpfulComments: 1, reviewComments: 4, reactions: 12 })
    const rows = scoreBreakdown(counts)
    expect(rows.slice(0, 4).map(row => [row.key, row.amount, row.points, row.total])).toEqual([
      ['docs', 3, 4, 12],
      ['feat', 1, 7, 7],
      ['reviewComments', 4, 1, 4],
      ['comments', 7, 0.5, 3.5],
    ])
    expect(rows).toHaveLength(12)
    expect(rows.find(row => row.key === 'reactions')?.total).toBe(1.2)
    expect(Math.round(rows.reduce((sum, row) => sum + row.total, 0))).toBe(score(counts))
  })
})

describe('advisory severity', () => {
  it('stores severity with the selected role once, including neutral missing severity', () => {
    const acc = new ContributorsAccumulator(new Date('2026-11-07T12:00:00Z'))
    const advisory = {
      ghsa_id: 'GHSA-severity', published_at: '2026-10-28T00:00:00Z', severity: 'moderate',
      credits: [{ type: 'finder', user: { id: 1, login: 'credited' } }, { type: 'analyst', user: { id: 1, login: 'credited' } }, { type: 'remediation_developer', user: { id: 1, login: 'credited' } }],
    }
    acc.addAdvisory(advisory)
    acc.addAdvisory(advisory)
    acc.addAdvisory({ ...advisory, ghsa_id: 'GHSA-missing', severity: null })
    const first = acc.records().get('all')![0]!
    expect(first).toMatchObject({
      advisories: 2,
      advisoryCredits: { analyst: { moderate: 1, unknown: 1 } }, score: 90,
    })
    first.advisoryCredits!.analyst!.moderate = 99
    expect(acc.records().get('all')![0]!.advisoryCredits!.analyst!.moderate).toBe(1)
  })
  it.each([
    ['finder', 20], ['reporter', 20], ['analyst', 30], ['remediation_developer', 30],
    ['remediation_reviewer', 10], ['coordinator', 1], ['remediation_verifier', 1],
    ['tool', 1], ['sponsor', 1], ['other', 1],
  ] as const)('applies every severity multiplier to %s credits', (role, base) => {
    for (const [severity, multiplier] of [['low', 1], ['moderate', 2], ['high', 3], ['critical', 5], ['unknown', 1]] as const) {
      const counted = { advisories: 1, advisoryCredits: { [role]: { [severity]: 1 } } }
      expect(advisoryPoints(counted)).toBe(base * multiplier)
      expect(Number.isInteger(advisoryPoints(counted))).toBe(true)
    }
  })

  it('keeps role and severity paired instead of multiplying the whole role count', () => {
    const counted = {
      ...stats({}), advisories: 3,
      advisoryCredits: { finder: { low: 1, critical: 1 }, remediation_developer: { moderate: 1 } },
    }
    expect(advisoryPoints(counted)).toBe(180)
    expect(scoreBreakdown(counted).find(row => row.key === 'advisories')).toMatchObject({
      total: 180, roles: [
        { role: 'finder', amount: 2, total: 120, severities: [
          { severity: 'low', amount: 1, multiplier: 1, total: 20 },
          { severity: 'critical', amount: 1, multiplier: 5, total: 100 },
        ] },
        { role: 'remediation_developer', amount: 1, total: 60 },
      ],
    })
  })

  it('keeps one-point advisory roles integral and rounds other activity only in the final score', () => {
    const counted = { ...stats({}, { comments: 3, reactions: 4 }), advisories: 3, advisoryCredits: { other: { moderate: 3 } } }
    expect(advisoryPoints(counted)).toBe(6)
    expect(score(counted)).toBe(8) // 6 + 1.5 + 0.4 = 7.9
  })
})

const now = new Date('2026-11-03T12:00:00Z')
let number = 0
const pr = (login: string, id: number, type: PullRequestType, landedAt: string, scopes: string[] = []): LandedPullRequest =>
  ({ number: ++number, author: { login, id }, type, scopes, landedAt })
const user = (login: string, id: number) => ({ login, id })

const records = (pulls: LandedPullRequest[]) => {
  const accumulator = new ContributorsAccumulator(now)
  for (const pull of pulls) accumulator.addLandedPullRequest(pull)
  return accumulator.records()
}

describe('ContributorsAccumulator, landed PRs only', () => {
  const files = records([
    pr('alice', 1, 'feat', '2026-10-20T00:00:00Z'), // 30d, 12m, 2026
    pr('alice', 1, 'docs', '2016-05-01T00:00:00Z'), // 2016
    pr('bob', 2, 'fix', '2026-01-15T00:00:00Z'), // 12m, 2026
    pr('bob', 2, 'fix', '2025-12-01T00:00:00Z'), // 12m, 2025
    pr('carol', 3, 'chore', '2014-09-18T00:00:00Z'), // 2014
  ])

  it('writes every period, even the empty ones', () => {
    expect([...files.keys()].slice(0, 4)).toEqual(['all', '30d', '12m', '2014'])
    expect(files.get('2015')).toEqual([])
  })

  it('counts each PR in all time, its rolling windows and its year', () => {
    expect(files.get('all')?.map(r => [r.username, r.score, r.pullRequests.all])).toEqual([['alice', 11, 2], ['bob', 10, 2], ['carol', 3, 1]])
    expect(files.get('30d')?.map(r => r.username)).toEqual(['alice'])
    expect(files.get('12m')?.map(r => [r.username, r.score])).toEqual([['bob', 10], ['alice', 7]])
    expect(files.get('2016')?.[0]?.pullRequests).toEqual({ feat: 0, fix: 0, docs: 1, chore: 0, all: 1 })
    expect(files.get('all')?.[0]).toMatchObject(emptyActivity())
  })

  it('keeps the first contribution across all periods, and ranks ties by username', () => {
    expect(files.get('30d')?.[0]?.firstContributionAt).toBe('2016-05-01T00:00:00.000Z')
    const tied = records([pr('zed', 9, 'fix', '2026-01-01T00:00:00Z'), pr('amy', 8, 'fix', '2026-01-01T00:00:00Z')])
    expect(tied.get('all')?.map(r => r.username)).toEqual(['amy', 'zed'])
  })

  it('keeps a renamed account as one contributor, under its latest login', () => {
    const renamed = records([pr('old-name', 7, 'feat', '2020-01-01T00:00:00Z'), pr('new-name', 7, 'fix', '2024-01-01T00:00:00Z')])
    expect(renamed.get('all')).toEqual([{
      githubId: 7, username: 'new-name', score: 12, pullRequests: { feat: 1, fix: 1, docs: 0, chore: 0, all: 2 }, ...emptyActivity(), firstContributionAt: '2020-01-01T00:00:00.000Z',
    }])
  })
})

describe('ContributorsAccumulator', () => {
  const issue = (author: ReturnType<typeof user> | null, extra: Partial<IssueInput> = {}): IssueInput =>
    ({ user: author, created_at: '2026-10-25T00:00:00Z', comments: 0, reactions: { total_count: 0 }, state_reason: null, ...extra })
  const comment = (author: ReturnType<typeof user> | null, reactions = 0, created_at = '2026-10-25T00:00:00Z'): CommentInput =>
    ({ user: author, created_at, reactions: { total_count: reactions } })

  it('counts issues, helpful when completed, with 3+ reactions or 5+ comments, and their reactions', () => {
    const acc = new ContributorsAccumulator(now)
    acc.addIssue(issue(user('ann', 1)))
    acc.addIssue(issue(user('ann', 1), { state_reason: 'completed' }))
    acc.addIssue(issue(user('ann', 1), { state_reason: 'not_planned', reactions: { total_count: 3 } }))
    acc.addIssue(issue(user('ann', 1), { comments: 5 }))
    acc.addIssue(issue(user('ann', 1), { comments: 4, reactions: { total_count: 2 } }))
    expect(acc.records().get('30d')?.[0]).toMatchObject({ username: 'ann', issues: 5, helpfulIssues: 3, reactions: 5, score: 15 }) // 5 + 9 + 0.5 = 14.5 → 15
  })

  it('counts a PR in the issues list for its reactions only', () => {
    const acc = new ContributorsAccumulator(now)
    acc.addIssue(issue(user('pat', 2), { pull_request: {}, reactions: { total_count: 10 }, comments: 9 }))
    expect(acc.records().get('all')?.[0]).toMatchObject({ username: 'pat', issues: 0, helpfulIssues: 0, reactions: 10, score: 1, firstContributionAt: null })
  })

  it('counts comments, helpful with 3+ reactions, and review comments at 1 point', () => {
    const acc = new ContributorsAccumulator(now)
    acc.addComment(comment(user('cy', 3), 2))
    acc.addComment(comment(user('cy', 3), 3))
    acc.addReviewComment(comment(user('cy', 3), 9))
    expect(acc.records().get('all')?.[0]).toMatchObject({ comments: 2, helpfulComments: 1, reviewComments: 1, reactions: 5, score: Math.round(1 + 2 + 1 + 0.5) })
  })

  it('counts each accepted role once per person and advisory, in the periods of publication', () => {
    const acc = new ContributorsAccumulator(now)
    const credit = (type: string, login: string, id: number) => ({ type, user: user(login, id) })
    const advisory = { ghsa_id: 'GHSA-aaaa-bbbb-cccc', published_at: '2025-06-01T00:00:00Z', credits: [credit('reporter', 'eve', 7), credit('finder', 'eve', 7), credit('finder', 'fay', 8), credit('finder', 'gus', 9), credit('remediation_developer', 'gus', 9), credit('remediation_reviewer', 'hal', 10), credit('analyst', 'ida', 11), credit('other', 'jo', 12)] }
    acc.addAdvisory(advisory)
    acc.addAdvisory(advisory)
    acc.addAdvisory({ ...advisory, ghsa_id: 'GHSA-dddd-eeee-ffff', published_at: '2026-10-30T00:00:00Z', credits: [credit('reporter', 'eve', 7)] })
    const files = acc.records()
    expect(files.get('all')?.map(r => [r.username, r.advisories, r.score])).toEqual([
      ['eve', 2, 40], ['gus', 1, 30], ['ida', 1, 30], ['fay', 1, 20], ['hal', 1, 10], ['jo', 1, 1],
    ])
    expect(files.get('all')?.find(r => r.username === 'eve')?.advisoryCredits).toEqual({ reporter: { unknown: 2 } })
    expect(files.get('all')?.find(r => r.username === 'jo')?.advisoryCredits).toEqual({ other: { unknown: 1 } })
    expect(files.get('all')?.find(r => r.username === 'gus')?.advisoryCredits).toEqual({ remediation_developer: { unknown: 1 } })
    expect(files.get('2025')?.map(r => [r.username, r.advisories])).toEqual([
      ['gus', 1], ['ida', 1], ['eve', 1], ['fay', 1], ['hal', 1], ['jo', 1],
    ])
    expect(files.get('30d')?.map(r => [r.username, r.advisories])).toEqual([['eve', 1]])
    expect(files.get('all')?.[0]?.firstContributionAt).toBe('2025-06-01T00:00:00.000Z')
  })

  it('counts a translation once for each of its translators, on the day it joined the footer', () => {
    const acc = new ContributorsAccumulator(now)
    const translation = { language: 'Türkçe', code: 'tr', flag: 'tr', site: 'https://angular-docs.tr', repository: 'https://github.com/erkamyaman/angular-tr', joinedAt: '2026-03-07', translators: [{ githubId: 7, username: 'eve' }, { githubId: 8, username: 'fay' }] }
    acc.addTranslation(translation)
    acc.addTranslation({ ...translation, language: 'Español', joinedAt: '2025-05-26', translators: [{ githubId: 7, username: 'eve' }] })
    const files = acc.records()
    expect(files.get('all')?.map(r => [r.username, r.translations, r.score])).toEqual([['eve', 2, 40], ['fay', 1, 20]])
    expect(files.get('2026')?.map(r => [r.username, r.translations])).toEqual([['eve', 1], ['fay', 1]])
    expect(files.get('all')?.[0]?.firstContributionAt).toBe('2025-05-26T00:00:00.000Z')
  })

  it('leaves out bots and deleted accounts', () => {
    const acc = new ContributorsAccumulator(now)
    acc.addComment(comment(user('angular-robot', 4), 5))
    acc.addComment(comment(user('google-cla[bot]', 5)))
    acc.addReviewComment(comment(null))
    acc.addIssue(issue(user('ghost', 10137)))
    expect(acc.records().get('all')).toEqual([])
  })

  it('combines PRs and activity, dates each in its periods, and keeps the first contribution', () => {
    const acc = new ContributorsAccumulator(now)
    acc.addLandedPullRequest(pr('dee', 6, 'fix', '2026-10-30T00:00:00Z'))
    acc.addComment(comment(user('dee', 6), 0, '2019-03-01T00:00:00Z'))
    acc.addReviewComment(comment(user('dee', 6), 0, '2025-06-01T00:00:00Z'))
    const files = acc.records()
    expect(files.get('all')?.[0]).toMatchObject({ score: 7, comments: 1, reviewComments: 1, firstContributionAt: '2019-03-01T00:00:00.000Z' })
    expect(files.get('30d')?.[0]).toMatchObject({ score: 5, comments: 0, reviewComments: 0 })
    expect(files.get('2019')?.[0]).toMatchObject({ comments: 1 })
    expect(files.get('2025')?.[0]).toMatchObject({ reviewComments: 1 })
  })
})

describe('ContributorsAccumulator.packages', () => {
  it('counts the packages of each contributor\'s merged PRs, all time, most first', () => {
    const acc = new ContributorsAccumulator(now)
    acc.addLandedPullRequest(pr('ann', 2, 'fix', '2016-01-01T00:00:00Z', ['router']))
    acc.addLandedPullRequest(pr('ann', 2, 'feat', '2026-10-30T00:00:00Z', ['core', 'router']))
    acc.addLandedPullRequest(pr('ann', 2, 'docs', '2026-10-30T00:00:00Z'))
    acc.addLandedPullRequest(pr('bob', 1, 'fix', '2026-10-30T00:00:00Z', ['forms']))
    acc.addLandedPullRequest(pr('cy', 3, 'chore', '2026-10-30T00:00:00Z'))
    expect(acc.packages()).toEqual([
      { githubId: 1, packages: [{ name: 'forms', pullRequests: 1 }] },
      { githubId: 2, packages: [{ name: 'router', pullRequests: 2 }, { name: 'core', pullRequests: 1 }] },
    ])
  })
})

describe('mergeRecords', () => {
  const record = (githubId: number, username: string, fix: number, comments: number, first: string | null): ContributorRecord => {
    const counts = { ...emptyActivity(), comments }
    const pullRequests = { ...emptyCounts(), fix, all: fix }
    return { githubId, username, score: score({ ...counts, pullRequests }), pullRequests, ...counts, firstContributionAt: first }
  }

  it('adds up the counts per contributor, recomputes the score, keeps the earliest first contribution and sorts', () => {
    const merged = mergeRecords([
      [record(1, 'ann', 2, 1, '2020-05-01T00:00:00.000Z'), record(2, 'bob', 1, 0, null)],
      [record(1, 'ann', 1, 2, '2019-01-01T00:00:00.000Z'), record(3, 'cy', 4, 0, '2021-01-01T00:00:00.000Z')],
    ])
    expect(merged.map(r => [r.username, r.score, r.pullRequests.all, r.pullRequests.fix, r.comments, r.firstContributionAt])).toEqual([
      ['cy', 20, 4, 4, 0, '2021-01-01T00:00:00.000Z'],
      // 3 fixes (15) + 3 comments (1.5): rounded once, 17, not 11 + 6.
      ['ann', 17, 3, 3, 3, '2019-01-01T00:00:00.000Z'],
      ['bob', 5, 1, 1, 0, null],
    ])
  })

  it('does not change its inputs', () => {
    const input = record(1, 'ann', 1, 0, null)
    mergeRecords([[input], [record(1, 'ann', 1, 0, null)]])
    expect(input.pullRequests.all).toBe(1)
  })

  it('merges paired credits and derives totals without trusting obsolete counters', () => {
    const first = {
      ...record(1, 'ann', 0, 0, null), advisories: 999,
      advisoryCredits: { finder: { moderate: 1 } },
    }
    const second = {
      ...record(1, 'ann', 0, 0, null), advisories: 999,
      advisoryCredits: { remediation_developer: { critical: 1 } },
    }
    expect(mergeRecords([[first], [second]])[0]).toMatchObject({
      advisories: 2, advisoryCredits: { finder: { moderate: 1 }, remediation_developer: { critical: 1 } }, score: 190,
    })
    expect(mergeRecords([[second], [first]])[0]?.score).toBe(190)
    expect(mergeRecords([[first]])[0]?.advisories).toBe(1)
    expect(first.advisoryCredits).toEqual({ finder: { moderate: 1 } })
    expect(first.advisories).toBe(999)
  })

})

describe('mergePackages', () => {
  it('adds up the PRs per package and sorts them', () => {
    expect(mergePackages([
      [{ githubId: 2, packages: [{ name: 'core', pullRequests: 1 }] }],
      [{ githubId: 2, packages: [{ name: '@angular/cdk', pullRequests: 3 }, { name: 'core', pullRequests: 1 }] }, { githubId: 1, packages: [{ name: 'router', pullRequests: 1 }] }],
    ])).toEqual([
      { githubId: 1, packages: [{ name: 'router', pullRequests: 1 }] },
      { githubId: 2, packages: [{ name: '@angular/cdk', pullRequests: 3 }, { name: 'core', pullRequests: 2 }] },
    ])
  })
})

describe('ContributorsAccumulator.calendar', () => {
  const comment = (author: ReturnType<typeof user> | null, created_at: string, reactions = 0): CommentInput =>
    ({ user: author, created_at, reactions: { total_count: reactions } })

  it('counts each contribution on its UTC day, per person', () => {
    const acc = new ContributorsAccumulator(now)
    acc.addLandedPullRequest(pr('ann', 1, 'fix', '2026-03-03T23:59:59Z'))
    acc.addComment(comment(user('ann', 1), '2026-03-03T08:00:00Z'))
    acc.addReviewComment(comment(user('ann', 1), '2026-03-04T00:00:00Z'))
    acc.addIssue({ user: user('bo', 2), created_at: '2019-07-01T12:00:00Z', comments: 0, reactions: { total_count: 0 }, state_reason: null })
    expect(acc.calendar()).toEqual(new Map([
      [1, new Map([['2026-03-03', 2], ['2026-03-04', 1]])],
      [2, new Map([['2019-07-01', 1]])],
    ]))
  })

  it('leaves out what is not a contribution of their own: reactions on a PR, an accepted answer, bots', () => {
    const acc = new ContributorsAccumulator(now)
    acc.addIssue({ user: user('cy', 3), created_at: '2026-01-01T00:00:00Z', pull_request: {}, reactions: { total_count: 9 } })
    acc.addAcceptedAnswer(comment(user('cy', 3), '2026-01-02T00:00:00Z'))
    acc.addComment(comment(user('google-cla[bot]', 4), '2026-01-03T00:00:00Z'))
    expect(acc.calendar()).toEqual(new Map())
  })
})
