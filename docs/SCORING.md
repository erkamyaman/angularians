# How the score works

Every contribution counts for its author, on the day it was made. The weights are those of [Nuxters](https://nuxt.com/nuxters),
plus review comments and security reports. The rules live in `shared/src/scoring.ts` and `shared/src/pull-requests.ts`.

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
| Review comment (inline, on the code of a PR) | 1 |
| Comment (on an issue, a PR or a discussion, replies too) | 0.5 |
| Helpful comment (3+ reactions, or marked as a discussion's answer) | +2 |
| Reaction received (on the day of the issue, PR or comment) | 0.1 |
| Security report (credited as `reporter` or `finder` on an Angular security advisory, on the day it is published) | 20 |

Discussions (angular/angular's RFCs) come from GitHub's GraphQL API: they are counted as issues and comments are, in
the issue and comment totals.

Security advisories are those of the `@angular/*`, `@angular-devkit/*`, `@nguniversal/*` and `@schematics/angular`
packages: the repositories' own advisories and GitHub's reviewed npm advisories, joined by GHSA id. Each counts once per
person, however many reporter and finder credits they have on it. Credits for fixing, reviewing or analysing an advisory
give no points: the fix's PR and its reviews already count. The run of angular/angular collects them (`collector/src/advisories.ts`).

The sum is rounded once.

## What counts as merged

A PR has landed if GitHub marks it merged, **or** a commit on the default branch has a `PR Close #N` line for it. Angular's merge
tooling pushes the commits itself and closes the PR, so GitHub shows most PRs from 2017 to 2025 as closed, not merged.
Before its first `PR Close` (January 2017), angular/angular's merge script wrote `Closes #N` instead: in that era, such a
commit lands PR N too. Only in repositories that use `PR Close`, and only before it: elsewhere `Closes #N` closes issues.

Bots are left out: GitHub apps, `-bot` accounts and the list in `shared/src/bots.ts`.

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
