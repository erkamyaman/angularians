import { describe, expect, it } from 'vitest'
import { canonicalPackage, closingNumbers, inferPullRequestType, landedPullRequests, packageRepo, prCloseNumbers, pullRequestScopes, type PullRequestInput } from '../src/pull-requests.ts'
import { isBotAccount } from '../src/bots.ts'
import { ContributorsAccumulator } from '../src/scoring.ts'

describe('inferPullRequestType', () => {
  it.each([
    ['feat(core): add input signals', 'feat'],
    ['perf(compiler): faster template parsing', 'feat'],
    ['fix(router): keep the query params', 'fix'],
    ['fix!: drop Node 18', 'fix'],
    ['docs: fix a typo', 'docs'],
    ['docs(docs-infra): new sidebar', 'docs'],
    ['refactor(core): split the scheduler', 'chore'],
    ['build: update to bazel 7', 'chore'],
    ['ci: cache the npm folder', 'chore'],
    ['test(forms): cover async validators', 'chore'],
    ['release: cut the v19.0.0 release', 'chore'],
    ['Revert "feat(core): add input signals"', 'chore'],
    ['revert: fix(router): keep the query params', 'chore'],
    ['  feat: leading spaces', 'feat'],
    // Leading tags are not part of the commit message.
    ['[Backport 21.2.X] fix(router): do not copy URL-sized objects', 'fix'],
    ['[19.2.x] docs: a typo', 'docs'],
    ['[PATCH] [19.2.x] build: bump', 'chore'],
    ['[WIP] feat(core): x', 'feat'],
    ['[19.2.x] Revert "feat(core): x"', 'chore'],
    ['[13.3.x]: docs(material/tabs): x', 'docs'],
    ['[19.2.x] - fix(core): x', 'fix'],
    ['[WIP] -- fix(core): x', 'fix'],
    ['[19.2.x] — fix(core): x', 'fix'],
    // No type in the title or the labels: chore.
    ['Bump version to "v22.2.3" with changelog.', 'chore'],
    ['Forms: always use the provided injector', 'chore'],
    ['', 'chore'],
  ] as const)('%s → %s', (title, type) => {
    expect(inferPullRequestType(title)).toBe(type)
  })

  it('does not read a prefix inside a word', () => {
    expect(inferPullRequestType('fixture cleanup', [{ name: 'docs' }])).toBe('docs')
    expect(inferPullRequestType('feature flags')).toBe('chore')
    expect(inferPullRequestType('testing', [{ name: 'maintenance' }])).toBe('chore')
  })

  it('falls back to the labels, then to chore', () => {
    expect(inferPullRequestType('Update README', [{ name: 'Documentation' }])).toBe('docs')
    expect(inferPullRequestType('Something', [{ name: 'area: core' }, { name: 'bug' }])).toBe('fix')
    expect(inferPullRequestType('Something', [{ name: 'enhancement' }])).toBe('feat')
    expect(inferPullRequestType('Something', [{ name: null }])).toBe('chore')
    expect(inferPullRequestType('Something')).toBe('chore')
  })
})

describe('prCloseNumbers', () => {
  it('reads every PR Close line of a commit message, once each', () => {
    const message = [
      'docs: fix capitalization in elements docs (#32917) (#32936)',
      '',
      'PR Close #32917',
      '',
      'PR Close #32936',
      'PR Close #32936',
    ].join('\n')
    expect(prCloseNumbers(message)).toEqual([32917, 32936])
  })

  it('ignores mentions that are not a PR Close line', () => {
    expect(prCloseNumbers('fix: something (#123)\n\nFixes #456\nSee PR Close #789 above')).toEqual([])
    expect(prCloseNumbers('pr close #1')).toEqual([])
    expect(prCloseNumbers('fix: x\n\nSame as PR Close #789')).toEqual([])
  })
})

const user = (login: string, id: number) => ({ login, id })
const pull = (number: number, title: string, author: PullRequestInput['user'], mergedAt: string | null = null): PullRequestInput =>
  ({ number, title, user: author, labels: [], merged_at: mergedAt })

describe('landedPullRequests', () => {
  it('credits Domino merged PRs to its single package, with or without a title scope', () => {
    const author = user('alice', 1)
    const landed = landedPullRequests([
      pull(1, 'fix: preserve element IDs', author, '2025-03-01T10:00:00Z'),
      pull(2, 'test(parser): cover nested HTML', author, '2025-03-02T10:00:00Z'),
      pull(3, 'fix: closed without landing', author),
    ], [], 'angular/domino')
    const accumulator = new ContributorsAccumulator(new Date('2025-03-03T00:00:00Z'))
    for (const pr of landed) accumulator.addLandedPullRequest(pr)
    expect(accumulator.packages()).toEqual([
      { githubId: 1, packages: [{ name: '@angular/domino', pullRequests: 2 }] },
    ])
    expect(accumulator.records().get('all')?.[0]).toMatchObject({ score: 8, pullRequests: { all: 2, fix: 1, chore: 1 } })
  })

  it('counts PRs GitHub marks merged, on their merge date', () => {
    expect(landedPullRequests([pull(1, 'feat: a', user('alice', 1), '2025-03-01T10:00:00Z')], [])).toEqual([
      { number: 1, author: user('alice', 1), type: 'feat', scopes: [], landedAt: '2025-03-01T10:00:00Z' },
    ])
  })

  it('counts closed PRs with a PR Close commit, on the earliest such commit, crediting the PR author', () => {
    const commits = [
      { message: 'fix(core): second commit\n\nPR Close #2', date: '2019-05-02T00:00:00Z' },
      { message: 'fix(core): first commit\n\nPR Close #2', date: '2019-05-01T00:00:00Z' },
    ]
    expect(landedPullRequests([pull(2, 'fix(core): two commits', user('bob', 2))], commits)).toEqual([
      { number: 2, author: user('bob', 2), type: 'fix', scopes: ['core'], landedAt: '2019-05-01T00:00:00.000Z' },
    ])
  })

  it('prefers the merge date when a PR has both', () => {
    const [landed] = landedPullRequests(
      [pull(3, 'docs: x', user('carol', 3), '2025-01-02T00:00:00Z')],
      [{ message: 'PR Close #3', date: '2025-01-01T00:00:00Z' }],
    )
    expect(landed?.landedAt).toBe('2025-01-02T00:00:00Z')
  })

  it('leaves out closed PRs that never landed, bots, deleted accounts, duplicates and bad dates', () => {
    const pulls = [
      pull(4, 'feat: closed without landing', user('dave', 4)),
      pull(5, 'chore(deps): update', user('renovate[bot]', 5), '2025-01-01T00:00:00Z'),
      pull(6, 'feat: from a deleted account', null, '2025-01-01T00:00:00Z'),
      pull(7, 'feat: ghost', user('ghost', 10137), '2025-01-01T00:00:00Z'),
      pull(8, 'feat: listed twice', user('erin', 8), '2025-01-01T00:00:00Z'),
      pull(8, 'feat: listed twice', user('erin', 8), '2025-01-01T00:00:00Z'),
      pull(9, 'feat: bad commit date', user('frank', 9)),
    ]
    const landed = landedPullRequests(pulls, [{ message: 'PR Close #9', date: 'not a date' }])
    expect(landed.map(pr => pr.number)).toEqual([8])
  })

  it('counts `Closes #N` commits as landing PR N before the repository\'s first PR Close, not after', () => {
    const pulls = [
      pull(10, 'feat(core): landed by the old merge script', user('alice', 1)),
      pull(11, 'fix(router): closed by a commit after PR Close started', user('bob', 2)),
      pull(12, 'fix(forms): closed by a PR Close commit', user('carol', 3)),
    ]
    const commits = [
      { message: 'feat(core): landed by the old merge script\n\nCloses #10\nCloses #5', date: '2015-06-01T00:00:00Z' },
      { message: 'fix(forms): x\n\nPR Close #12', date: '2017-01-13T00:00:00Z' },
      { message: 'fix(router): y\n\nFixes #11', date: '2017-02-01T00:00:00Z' },
    ]
    expect(landedPullRequests(pulls, commits).map(pr => [pr.number, pr.landedAt])).toEqual([
      [10, '2015-06-01T00:00:00.000Z'],
      [12, '2017-01-13T00:00:00.000Z'],
    ])
  })

  it('never reads `Closes #N` in a repository without PR Close commits', () => {
    const pulls = [pull(20, 'fix(material/button): replaced by another PR', user('dave', 4))]
    expect(landedPullRequests(pulls, [{ message: 'fix: the other PR\n\nCloses #20', date: '2020-01-01T00:00:00Z' }], 'angular/components')).toEqual([])
  })
})

describe('closingNumbers', () => {
  it.each([
    ['feat: x\n\nCloses #123', [123]],
    ['fix: x\n\nFixes #1\nCloses #2\nresolves: #3', [1, 2, 3]],
    ['Typo in web_workers.md Closes #6694', []],
    ['fix: x\n\nCloses #12, #13', [12]],
    ['see #5 and PR Close #6', []],
    ['Closes #7\nCloses #7', [7]],
  ] as const)('%j → %j', (message, numbers) => {
    expect(closingNumbers(message)).toEqual(numbers)
  })
})

describe('isBotAccount', () => {
  it.each(['renovate[bot]', 'dependabot[bot]', 'angular-robot', 'some-bot', 'ghost', 'codecov-io', 'Codecov-Commenter', '', null, undefined])('%s is a bot', (login) => {
    expect(isBotAccount(login)).toBe(true)
  })

  it.each(['alice', 'robot-fan', 'botanist'])('%s is not a bot', (login) => {
    expect(isBotAccount(login)).toBe(false)
  })
})

describe('pullRequestScopes', () => {
  it.each([
    ['fix(router): keep the query params', ['router']],
    ['feat(core, compiler): input signals', ['core', 'compiler']],
    ['docs(dependency injection): a new guide', []],
    ['fix(core,compiler): no space', ['core', 'compiler']],
    ['feat(Core)!: drop zone.js', ['core']],
    ['docs(docs-infra): new sidebar', ['docs-infra']],
    ['refactor(zone.js): clean up', ['zone.js']],
    ['build: update to bazel 7', []],
    ['Revert "fix(router): x"', []],
    ['fix(): empty', []],
    // Docs PRs without a scope: the Angular agent skills, or angular.dev.
    ['docs: mention `getError()` in signal forms skill', ['skills']],
    ['docs: update compiler-cli and core reference skills', ['skills']],
    ['docs: fix a typo in the signals guide', ['docs']],
    ['docs(forms): a skill for signal forms', ['forms']],
    // Backports and patch ports: none, the change counts through the PR that landed it on main.
    ['[Backport 21.2.X] fix(router): snapshots', []],
    ['[PATCH] [19.2.x] fix(core, forms): x', []],
    ['[19.2.x] docs: a typo', []],
    ['[Patch port] fix(core): x', []],
    ['[14.2 backport] perf(compiler-cli): x', []],
    ['[v19.2.x] fix(core): x', []],
    ['[1.2.3-rc.0] fix(core): x', []],
    ['[Patch version for #29189] fix(core): x', []],
    ['[WIP] [19.2.x] fix(core): x', []],
    ['[19.2.x] - fix(core): x', []],
    ['[WIP] - fix(core): x', ['core']],
    // A revert written with a scope names its package, as before; `Revert "…"` does not.
    ['revert(core): x', ['core']],
    ['  [cherry-pick] fix(core): x', []],
    ['[19.2.x] Revert "fix(core): y"', []],
    // Other leading tags are skipped.
    ['[WIP] fix(core): x', ['core']],
    ['[skills] docs: x', ['docs']],
    ['fix(core): see [19.2.x]', ['core']],
  ] as const)('%s → %j', (title, scopes) => {
    expect(pullRequestScopes(title)).toEqual(scopes)
  })
})

describe('pullRequestScopes in other repositories', () => {
  it.each([
    ['angular/components', 'fix(material/button, cdk/overlay): focus', ['@angular/material', '@angular/cdk']],
    ['angular/components', 'fix(material/select): a\nfix(material/core): b', ['@angular/material']],
    ['angular/components', 'docs(multiple): typos', []],
    ['angular/components', 'feat(google-maps): add a marker clusterer', ['@angular/google-maps']],
    ['angular/components', 'fix(aria/grid): keyboard navigation', ['@angular/aria']],
    ['angular/zone.js', 'fix(core): patch the right event', ['zone.js']],
    ['angular/zone.js', 'chore: release v0.9.1', ['zone.js']],
    ['angular/universal', 'fix(@nguniversal/express-engine): keep the request', ['@nguniversal/express-engine']],
    ['angular/universal', 'build: update dependencies', []],
    ['angular/universal', 'fix(common): no npm name', []],
    ['angular/components', 'fix(@angular/cdk/overlay): written as the npm name', ['@angular/cdk']],
    ['angular/components', 'fix(@angular/aria): x', ['@angular/aria']],
    ['angular/components', '[20.0.x] fix(aria/grid): a backport', []],
    ['angular/components', 'fix(@angular/build): not a components package', []],
    ['angular/angular-cli', '[19.2.x] fix(@angular/build): a backport', []],
    ['angular/domino', '[19.2.x] fix(core): every domino PR counts', ['@angular/domino']],
    ['angular/angular-cli', 'fix(@angular/build): keep the base href', ['@angular/build']],
    ['angular/angular-cli', 'feat(@schematics/angular, @angular/cli): ai config', ['@schematics/angular', '@angular/cli']],
    ['angular/angular-cli', 'build: update dependency', []],
    ['angular/angular-cli', 'fix(build): no package', []],
    ['angular/dev-infra', 'fix(ng-dev): release notes', []],
    ['angular/angular-cli', 'docs: update the readme', []],
    // angular/angular is unchanged: no npm-style names.
    ['angular/angular', 'fix(@angular/core): x', []],
  ])('%s: %s', (repo, title, scopes) => {
    expect(pullRequestScopes(title, repo)).toEqual(scopes)
  })
})

describe('packageRepo', () => {
  it.each([
    ['router', 'angular/angular'],
    ['@angular/material', 'angular/components'],
    ['@angular/cdk', 'angular/components'],
    ['@angular/aria', 'angular/components'],
    ['@nguniversal/express-engine', 'angular/universal'],
    ['zone.js', 'angular/angular'],
    ['@angular/build', 'angular/angular-cli'],
    ['@schematics/angular', 'angular/angular-cli'],
    ['@angular/domino', 'angular/domino'],
  ])('%s → %s', (name, repo) => expect(packageRepo(name)).toBe(repo))
})

describe('canonicalPackage', () => {
  it('folds misspelled scopes into the package they mean', () => {
    expect(canonicalPackage('platform-brower')).toBe('platform-browser')
    expect(canonicalPackage('migration')).toBe('migrations')
    expect(canonicalPackage('router')).toBe('router')
    expect(pullRequestScopes('fix(dev-tools): x')).toEqual(['devtools'])
  })
})
