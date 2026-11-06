---
name: add-a-repository
description: Add a GitHub repository to the Angularians board, so its contributors are collected and ranked. Use when someone asks to count contributions to another Angular repository.
disable-model-invocation: true
---

# Add a repository

Only repositories of the `angular` organization join the board, and the maintainer decides which. Open an issue to agree on it before the pull request.

## Steps

1. Add `owner/name` to `REPOS` in `shared/src/repos.ts`, in the order the site should list it.
2. Add it to the matrix of `.github/workflows/collect.yml`, as the others are.
3. If its PR titles name packages (`fix(router): …`), teach `pullRequestScopes` in `shared/src/pull-requests.ts` to read them, and `packageLabel` in `app/src/app/profile/packages.ts` what to show, with tests next to each.
4. List it in the README and in "How to become an Angularian" on the home page (`app/src/app/pages/index.page.html`).
5. `pnpm test`, `pnpm typecheck` and `pnpm build` pass. The next nightly run collects its full history.

Pull request: branch `feat/repo-<name>`, title `feat(collector): count <owner/name>`, with no trailer lines.
