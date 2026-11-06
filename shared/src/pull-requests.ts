// PR type rules ported from nuxt/nuxters `scripts/collect-contributors.ts` (MIT, Copyright (c) 2023 Nuxt).
import { isBotAccount } from './bots.ts'
import type { GitHubUser, LandedPullRequest, PullRequestType } from './types.ts'

/**
 * Conventional commit prefixes, as angular/angular enforces them on PR titles
 * (build, ci, docs, feat, fix, perf, refactor, release, test), plus the ones other repos use.
 * Added to the Nuxters list: `release` and `revert` count as chores.
 */
const TITLE_TYPE_PATTERNS: Array<[RegExp, PullRequestType]> = [
  [/^docs[\s(:!]/i, 'docs'],
  [/^fix[\s(:!]/i, 'fix'],
  [/^feat[\s(:!]/i, 'feat'],
  [/^perf[\s(:!]/i, 'feat'],
  [/^chore[\s(:!]/i, 'chore'],
  [/^ci[\s(:!]/i, 'chore'],
  [/^build[\s(:!]/i, 'chore'],
  [/^test[\s(:!]/i, 'chore'],
  [/^refactor[\s(:!]/i, 'chore'],
  [/^style[\s(:!]/i, 'chore'],
  [/^release[\s(:!]/i, 'chore'],
  [/^revert[\s(:!"]/i, 'chore'],
]

const LABEL_TYPE_MAP: Record<string, PullRequestType> = {
  documentation: 'docs',
  docs: 'docs',
  bug: 'fix',
  fix: 'fix',
  feature: 'feat',
  feat: 'feat',
  enhancement: 'feat',
  chore: 'chore',
  maintenance: 'chore',
  dependencies: 'chore',
}

/**
 * The first tag's text of a backport or patch port, as the Angular repositories write it: a release branch
 * (`[19.2.x]`, `[Backport 21.2.X]`, `[14.2 backport]`) or a word for it (`[PATCH]`, `[Patch port]`, `[Cherry pick]`,
 * `[LTS port]`, the misspelt `[Path port]`, or a longer tag with one of these words, `[Patch version for #29189]`). Not `[WIP]`.
 */
const PORT_TAG_RE = /^\s*(?:v?\d+(?:\.(?:\d+|x))+\b|.*\b(?:backport|patch|path port|cherry[- ]?pick|lts port)\b)/i

/** The text of each tag in a title's leading tags: `[WIP] [19.2.x] fix(core): …` → `WIP`, `19.2.x`. */
const TAG_TEXT_RE = /\[([^\]\n]*)\]/g

/** Any leading tags, `[19.2.x] `, `[WIP] `, `[PATCH] [19.2.x] `, `[13.3.x]: `, `[13.3.x] — `: not part of the commit message. */
const TAGS_RE = /^\s*(?:\[[^\]\n]*\]\s*[:\-\u2013\u2014]*\s*)+/

/** A title without its leading tags: `[20.0.x] fix(core): …` → `fix(core): …`, `[WIP] fix(core): …` → `fix(core): …`. */
function untagged(title: string): string {
  return title.replace(TAGS_RE, '')
}

/** Whether a title is a backport's or patch port's, by any of its leading tags. */
function isPort(title: string): boolean {
  const tags = TAGS_RE.exec(title)?.[0] ?? ''
  for (const tag of tags.matchAll(TAG_TEXT_RE)) if (PORT_TAG_RE.test(tag[1]!)) return true
  return false
}

/** The type from the title prefix (after any leading tags), then from the labels. Neither: `chore`. */
export function inferPullRequestType(title: string, labels: ReadonlyArray<{ name?: string | null }> = []): PullRequestType {
  const trimmed = untagged(title).trim()
  for (const [pattern, type] of TITLE_TYPE_PATTERNS) {
    if (pattern.test(trimmed)) return type
  }
  for (const label of labels) {
    const type = LABEL_TYPE_MAP[label.name?.toLowerCase() ?? '']
    if (type) return type
  }
  // Nuxters falls back to `feat`, the highest weight; titles without a type here are mostly version bumps and housekeeping.
  return 'chore'
}

/** `feat(core, compiler)!: …` → `core, compiler`. */
const SCOPE_RE = /^\s*[a-z]+\(([^)]+)\)!?:/i

/** The published packages of angular/components, by the first part of a scope (`fix(material/button): …`). */
const COMPONENTS_PACKAGES = new Set([
  'material', 'cdk', 'aria', 'material-experimental', 'cdk-experimental', 'google-maps', 'youtube-player',
  'material-luxon-adapter', 'material-moment-adapter', 'material-date-fns-adapter',
])

/** Misspelled or variant scopes of angular/angular, as some PR titles have them: the package they mean. */
const SCOPE_ALIASES: Readonly<Record<string, string>> = {
  'platform-brower': 'platform-browser',
  'migration': 'migrations',
  'dev-tools': 'devtools',
  'animation': 'animations',
  'form': 'forms',
  'routing': 'router',
  'service-workers': 'service-worker',
  'zone': 'zone.js',
  'zonejs': 'zone.js',
}

/** A package name of `packages.json` as the site shows it: aliases folded into the package they mean. */
export function canonicalPackage(name: string): string {
  return SCOPE_ALIASES[name] ?? name
}

/**
 * The package a scope names in a repository, `null` when it is not one. Names are distinct across repositories:
 * - angular/angular: the scope itself (`router`), as before there were other repositories.
 * - angular/components: its npm package (`material/button` → `@angular/material`).
 * - angular/angular-cli: scopes are npm packages already (`@angular/build`, `@schematics/angular`).
 * - Other repositories (angular/dev-infra): no packages.
 */
function repoPackage(repo: string, scope: string): string | null {
  if (repo === 'angular/angular') return /^[a-z0-9][a-z0-9.-]*$/.test(scope) ? canonicalPackage(scope) : null
  if (repo === 'angular/components') {
    // `aria/grid`, or written as the npm name, `@angular/cdk/overlay`.
    const name = scope.replace(/^@angular\//, '').split('/')[0]!
    return COMPONENTS_PACKAGES.has(name) ? `@angular/${name}` : null
  }
  if (repo === 'angular/angular-cli') return /^@[a-z0-9-]+\/[a-z0-9-]+$/.test(scope) ? scope : null
  return null
}

/** The repository of a package of `packages.json`: npm names come from the other repositories, scopes from angular/angular. */
export function packageRepo(name: string): string {
  if (name === '@angular/domino') return 'angular/domino'
  if (!name.startsWith('@')) return 'angular/angular'
  return name.startsWith('@angular/') && COMPONENTS_PACKAGES.has(name.slice('@angular/'.length)) ? 'angular/components' : 'angular/angular-cli'
}

/** An angular/angular docs PR without a scope (`docs: …`): its Angular agent skills (`skills/`) when it says so. */
const UNSCOPED_DOCS_RE = /^\s*docs!?:/i
const SKILL_RE = /\bskills?\b/i

/**
 * The packages a PR title names, lowercased: `fix(router): …` → `['router']`. Empty without a scope, except for
 * angular/angular's docs PRs without one: `skills` when the title is about a skill, else `docs` (angular.dev).
 * Every angular/domino PR belongs to its single package, regardless of the title's scope.
 * Backports (`[19.2.x] fix(core): …`) are empty: the change already counts once, through the PR that landed it on main.
 * Other leading tags are skipped: `[WIP] fix(core): …` → `['core']`.
 */
export function pullRequestScopes(title: string, repo = 'angular/angular'): string[] {
  if (repo === 'angular/domino') return ['@angular/domino']
  if (isPort(title)) return []
  title = untagged(title)
  const match = SCOPE_RE.exec(title)
  if (!match) {
    if (repo === 'angular/angular' && UNSCOPED_DOCS_RE.test(title)) return [SKILL_RE.test(title) ? 'skills' : 'docs']
    return []
  }
  // Scopes are separated by commas; a space inside one (`dependency injection`) is part of it, not a second scope.
  const scopes = match[1]!.split(',').map(scope => scope.trim().toLowerCase()).filter(Boolean)
  return [...new Set(scopes.map(scope => repoPackage(repo, scope)).filter(name => name !== null))]
}

const PR_CLOSE_RE = /^PR Close #(\d+)\s*$/gm
/** `Closes #123` at the start of a line, as angular/angular's merge script wrote it before `PR Close` (to January 2017). */
const CLOSES_RE = /^\s*(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?):?\s+#(\d+)\b/gim

/**
 * The PR numbers a commit message closes. angular/angular's merge tool lands a PR by pushing its commits
 * to the main branch with a `PR Close #N` line in each, then closes the PR: GitHub shows it as closed, not merged.
 */
export function prCloseNumbers(message: string): number[] {
  const numbers = new Set<number>()
  for (const match of message.matchAll(PR_CLOSE_RE)) numbers.add(Number(match[1]))
  return [...numbers]
}

/** The numbers a commit message closes with GitHub's keywords, `Closes #N` or `Fixes #N` at the start of a line: issues or PRs. */
export function closingNumbers(message: string): number[] {
  const numbers = new Set<number>()
  for (const match of message.matchAll(CLOSES_RE)) numbers.add(Number(match[1]))
  return [...numbers]
}

/** A pull request as `GET /repos/{owner}/{repo}/pulls?state=all` lists it, the fields used here. */
export interface PullRequestInput {
  number: number
  title: string
  user: { login?: string | null, id?: number | null, type?: string | null } | null
  labels?: ReadonlyArray<{ name?: string | null }>
  merged_at: string | null
}

/** A commit of the main branch, the fields used here. */
export interface CommitInput {
  message: string
  /** ISO date the commit landed (the committer date). */
  date: string
}

/**
 * The pull requests that landed, each once:
 * - GitHub marks it merged: it landed on `merged_at`.
 * - Otherwise, a commit on the main branch has `PR Close #N` for it: it landed on the earliest such commit.
 *   A PR of several commits has the line in each, and still counts once.
 * - Before a repository's first `PR Close` (angular/angular to January 2017), its merge script wrote `Closes #N`:
 *   such a commit lands PR N too. Only in repositories that use `PR Close`, and only before it, where `Closes #N`
 *   naming a PR meant that PR landed; elsewhere it closes issues, or a PR replaced by another one.
 * PRs by bots, or by deleted accounts, are left out.
 */
export function landedPullRequests(pulls: Iterable<PullRequestInput>, commits: Iterable<CommitInput>, repo = 'angular/angular'): LandedPullRequest[] {
  const dated = [...commits].map(commit => ({ commit, time: Date.parse(commit.date) })).filter(({ time }) => !Number.isNaN(time))
  let firstPrClose = Infinity
  for (const { commit, time } of dated) if (time < firstPrClose && prCloseNumbers(commit.message).length) firstPrClose = time
  const closedOn = new Map<number, number>()
  const close = (number: number, time: number) => {
    const earliest = closedOn.get(number)
    if (earliest === undefined || time < earliest) closedOn.set(number, time)
  }
  for (const { commit, time } of dated) {
    for (const number of prCloseNumbers(commit.message)) close(number, time)
    // No `PR Close` anywhere: Infinity is not finite, so this era never applies.
    if (Number.isFinite(firstPrClose) && time < firstPrClose) {
      for (const number of closingNumbers(commit.message)) close(number, time)
    }
  }

  const landed = new Map<number, LandedPullRequest>()
  for (const pull of pulls) {
    if (landed.has(pull.number)) continue
    const author = toUser(pull.user)
    if (!author) continue
    const closed = closedOn.get(pull.number)
    const landedAt = pull.merged_at ?? (closed === undefined ? null : new Date(closed).toISOString())
    if (!landedAt) continue
    landed.set(pull.number, {
      number: pull.number,
      author,
      type: inferPullRequestType(pull.title, pull.labels),
      scopes: pullRequestScopes(pull.title, repo),
      landedAt,
    })
  }
  return [...landed.values()].sort((a, b) => a.number - b.number)
}

function toUser(user: PullRequestInput['user']): GitHubUser | null {
  const login = user?.login
  const id = user?.id
  if (!login || typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0 || isBotAccount(login, user?.type)) return null
  return { login, id }
}
