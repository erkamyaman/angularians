# How the score works

Every contribution counts for its author, on the day it was made (a pull request on the day it landed). The base weights are those of [Nuxters](https://nuxt.com/nuxters),
plus review comments, security advisory credits and translations; GitHub Discussions count too, as issues and comments. Unlike Nuxters, no repository counts double,
a translation counts once for each of its translators rather than by segment, and a pull request without a type is a chore, not a feat ([how they compare](research/score-vs-other-leaderboards.md)). The points of each kind of contribution are in `KINDS` (`shared/src/kinds.ts`); advisory roles and severity multipliers are in `shared/src/advisory-scoring.ts`. The other rules are in `shared/src/scoring.ts` and `shared/src/pull-requests.ts`.

## Merged pull requests, by type

The type comes from the PR title, the convention the Angular repositories already enforce. Leading tags are skipped:
`[Backport 21.2.x] fix(router): …` and `[13.3.x]: fix(core): …` are fixes. A title without a type takes it from the labels (`bug` is a fix, `enhancement`
a feat, `documentation` docs), else counts as a chore: these are mostly version bumps and housekeeping.

| Type | Points | PR title prefixes |
| --- | --- | --- |
| feat | 7 | `feat`, `perf` |
| fix | 5 | `fix` |
| docs | 4 | `docs` |
| chore | 3 | `chore`, `ci`, `build`, `test`, `refactor`, `style`, `release`, `revert` |

## Everything else

| Contribution | Points |
| --- | --- |
| Issue, or GitHub Discussion | 1 |
| Helpful issue (closed as completed, or 3+ reactions, or 5+ comments; a discussion by reactions or comments) | +3 |
| Review comment (inline, on the code of a PR; a review's summary does not count) | 1 |
| Comment (on an issue, a PR or a discussion, replies too) | 0.5 |
| Helpful comment (3+ reactions, or marked as a discussion's answer) | +2 |
| Reaction received (on an issue, a PR, a discussion or a comment, not on a review comment; on the day of what got it) | 0.1 |
| Security advisory: `analyst` or `remediation_developer` | 30 |
| Security advisory: `finder` or `reporter` | 20 |
| Security advisory: `remediation_reviewer` | 10 |
| Security advisory: `coordinator`, `remediation_verifier`, `tool`, `sponsor` or `other` | 1 |
| Translation (translating angular.dev into a language, one of its community translations, on the day the commit linking it landed in the footer, or a pull request asked for that link) | 20 |

Advisory values above are base points. Every credited role uses the same severity multiplier, applied per advisory:

| Severity | Multiplier |
| --- | --- |
| Low | ×1 |
| Moderate | ×2 |
| High | ×3 |
| Critical | ×5 |
| Unspecified | ×1 |

An advisory earns `role points × severity multiplier`. Buckets keep both values together in
`advisoryCredits: { role: { severity: count } }`; a contributor with one low and one critical finder credit earns
`20 × 1 + 20 × 5 = 120`, not the same multiplier on both. Advisory points remain integers; the total score is rounded after combining other activity.
Repository severity takes precedence; GitHub's global record fills missing severity. Snapshots keep role and
severity together and use `moderate` as the canonical value. The `advisoryCredits` buckets are the source of security
points. The `advisories` total is derived from those buckets for profile counts and badges.

The profile keeps the security credit count and total points visible. A single "View calculation" disclosure contains
the groups of roles with equal base points. Each group has its own disclosure with the role names, credit count and
subtotal; expanding it shows severity, credits and earned points in a table. Multiple groups can stay open for
comparison. The collector still keeps each role and severity together.

Discussions (in every repository that has them, such as angular/angular's RFCs) come from GitHub's GraphQL API: they are
counted as issues and comments are, in the issue and comment totals.

Security advisories are those of the `@angular/*`, `@angular-devkit/*`, `@nguniversal/*` and `@schematics/angular`
packages: the repositories' own advisories and GitHub's reviewed npm advisories, joined by GHSA id. Every accepted credit
counts as one advisory for that person, on its publication date. When someone has multiple roles on one advisory, their
highest-valued role scores once. Fixing and reviewing also earn the usual PR and review points. The run of angular/angular
collects the advisories (`collector/src/advisories.ts`).
Repository advisories without a CVE can be absent from GitHub's global advisory search. The Shieldwall badge reads the
collected all-time `advisories` count from the same profile data as the score. It needs no manually maintained list of
GitHub ids; new recipients appear after collection. Its total can be higher than the linked global search result.

Translations are the community translations of angular.dev, in its footer or with a pull request open to add them, from the hand-kept list in
`shared/src/translations.ts`: the lead of each, and everyone with five or more translation commits in its repository,
counts it once. The run of angular/angular counts them, with the advisories. Each translator also wears its badge.

The sum is rounded once.

## What counts as merged

A PR has landed if GitHub marks it merged, **or** a commit on the default branch has a `PR Close #N` line for it. Angular's merge
tooling pushes the commits itself and closes the PR, so GitHub shows most PRs from 2017 to 2025 as closed, not merged.
Before its first `PR Close` (January 2017), angular/angular's merge script wrote `Closes #N` instead: in that era, a
commit that closes #N with one of GitHub's keywords at the start of a line (close, closes, closed, fix, fixes, fixed,
resolve, resolves or resolved, in any case, with an optional colon) lands PR N too. Only in repositories that use
`PR Close`, and only before it: elsewhere these keywords close issues.

Bots are left out: GitHub apps, `[bot]` and `-bot` accounts and the list in `shared/src/bots.ts`; so are deleted accounts (`ghost`).

## Packages on profiles

"Contributed to" groups landed PRs by the packages their titles name. In angular/components a scope's first part names the
npm package: `fix(aria/grid)` is `@angular/aria`, `fix(material/button)` and `fix(@angular/material/button)` are
`@angular/material`; `multiple` names none. Reverts written as `Revert "…"` and backports (`[19.2.x] …`, `[Backport 21.2.x] …`,
`[PATCH] …`) count toward no package: the change counts once, through the PR that landed it on main. Other leading tags are skipped:
`[WIP] fix(core): …` counts toward `core`. The angular/domino repository provides `@angular/domino`,
the DOM implementation bundled with `@angular/platform-server` for server-side rendering. Every landed PR in angular/domino
counts toward `@angular/domino`, even without a scope in its title, and even a backport. The same goes for the archived
angular/zone.js and `zone.js`, the package angular/angular has published since 2019. The archived angular/universal's
scopes are npm packages (`@nguniversal/express-engine`).

## Periods

All time, the last 30 days, the last 12 months, and every year from 2014. A contributor's rank is per period.
