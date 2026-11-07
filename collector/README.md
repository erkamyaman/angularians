# Collector

Collects what everyone contributed to the Angular repositories (`REPOS` in `shared/src/repos.ts`: angular/angular,
angular/components, angular/angular-cli, angular/dev-infra, angular/domino, and the archived angular/zone.js and angular/universal; landed pull requests, issues, conversation comments, inline
review comments, GitHub Discussions, reactions received, and the reporters of Angular's security advisories) and writes the contributor files the app reads.
Based on [nuxt/nuxters](https://github.com/nuxt/nuxters) (MIT, Copyright (c) 2023 Nuxt).

## What counts

Every night it re-collects everything, like nuxt/nuxters: no cache, every score recomputed.

A PR has landed if GitHub marks it merged, **or** a commit on the default branch has a `PR Close #N` line for it.
Angular's merge tool pushes the commits itself and closes the PR, so GitHub shows most PRs from
2017 to 2025 as closed, not merged. Before a repository's first `PR Close` commit (angular/angular: January 2017), a
commit that closes #N with one of GitHub's keywords lands PR N too: a line that starts with close, closes, closed, fix, fixes,
fixed, resolve, resolves or resolved (any case, an optional colon), then `#N`. The landed PR is credited to its author.
GitHub Discussions (of every repository that has them, such as angular/angular's RFCs) come from GraphQL (`src/discussions.ts`) and count as issues and comments do; the token needs no extra permission for public
repositories. Scoring rules are in
`shared/src/scoring.ts` and `shared/src/pull-requests.ts`.

## Run it

```bash
GITHUB_TOKEN=… pnpm collect                                 # full history → data/
GITHUB_TOKEN=… pnpm collect -- --since=90d --out=/tmp/test  # a quick test run, marked partial in meta.json
```

| Flag | Env var | Default | |
|---|---|---|---|
| `--repos=a/b,c/d` | `COLLECT_REPOS` | every repository in `REPOS` | |
| `--part` | | off | Write the repositories as a part for `merge.ts`, not the site's data |
| `--since=90d` or `--since=2026-08-01` | `COLLECT_SINCE` | full history | Test runs only |
| `--pulls=rest\|search` | `COLLECT_PULLS` | `rest` | `search` when `/pulls` is not reachable: same data, more requests |
| `--no-activity` | `COLLECT_ACTIVITY=false` | activity on | Landed PRs only: no issues, comments, review comments or discussions; no security advisories either, unless `--advisories` |
| `--no-advisories` | `COLLECT_ADVISORIES=false` | on in the run of angular/angular | No Angular security advisories (their reporters score 20 points each; `--advisories` turns them on in another run) |
| `--no-profiles` | `COLLECT_PROFILES=false` | profiles on | Profiles need GraphQL, so a token |
| `--out=dir` | `CONTRIBUTORS_OUTPUT_DIR` | `data/` | |
| | `COLLECT_CACHE_DIR` | `.cache/` | The treeless git clone of the repo |

Commits come from a local treeless git clone (commit messages only, about 16 MB), not the API.
A full run of angular/angular alone needs about 6,500 REST requests (most of them its ~420,000 comments and review
comments, 100 a page) and takes about 3 hours; angular/components and angular/angular-cli are about half its size each.
For angular/angular, angular/components and angular/angular-cli the built-in Actions token (1,000 requests an hour,
shared by the jobs that use it) is not enough: they use a GitHub App or a personal token (5,000 an hour each). The four
small repositories use the built-in token.

### In CI: one job per repository

One after the other, the repositories take longer than a job may run. The workflow collects each in a job of its
own, in parallel (`collect --part --repos=…`), and a last job merges the parts into `data/` (`merge`): counts added up
per contributor, scores recomputed, then the team and the profiles. If one repository fails, nothing is published.

```bash
pnpm collect -- --part --repos=angular/components --out=/tmp/parts/components
pnpm --filter @angularians/collector merge /tmp/parts/angular /tmp/parts/components …   # into data/
```

### The token

A fine-grained personal access token, saved as the repository secret `COLLECT_TOKEN`:
GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.
Repository access: **Public repositories (read-only)**; no permissions. It expires: renew it before the date you pick.

The job of angular/angular also uses a GitHub App, for its own 5,000 requests an hour: the repository secrets
`COLLECT_APP_ID` and `COLLECT_APP_KEY` (its private key). The App asks for no permissions and must be installed on the
account that owns this repository (`src/auth.ts`). Without them, that job uses `COLLECT_TOKEN` too. The jobs of
angular/dev-infra, angular/domino, angular/zone.js and angular/universal use the workflow's built-in token.

A manual run of the workflow with a `since` (e.g. `30d`) is a test: it uploads the files as an artifact and commits
nothing.

## Output

- `contributors.json` (all time), `contributors-30d.json`, `contributors-12m.json`, `contributors-<year>.json` from 2014:
  one record per line, sorted by score then username.
- `profiles.json`: name, website, social accounts and country of every all-time contributor who set any.
  If GraphQL fails, the previous file is kept.
- `packages.json`: the packages each contributor's landed PRs named, all time.
- `team.json`: the public members of the `angular` organization (the "Angular team" badge). If the API fails, the
  previous file is kept.
- `renames.json`: old usernames of renamed accounts, found by comparing usernames with the previous run by GitHub id.
- `meta.json`: when, what, and counts (landed by merge vs by `PR Close`).

A full run with fewer than 1,000 contributors writes nothing: it is most likely broken.

The run prints `Possible bots:`. Add real bots to `KNOWN_BOT_ACCOUNTS` in `shared/src/bots.ts`.

`.github/workflows/collect.yml` runs it nightly and commits `data/`.
