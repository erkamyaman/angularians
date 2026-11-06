---
name: add-a-repository
description: Maintainer recipe for adding a repository to the board, after its issue is agreed.
disable-model-invocation: true
---

# Add a repository

Only repositories of the `angular` organization join the board, and only after the maintainer agrees in an issue.

## Steps

1. Add `owner/name` to `REPOS` in `shared/src/repos.ts`, in the order the site should list it. Done when it is in the list.
2. Add it to the matrix of `.github/workflows/collect.yml`, in the same shape as the others. Done when the matrix has one entry per repository in `REPOS`.
3. If its PR titles name packages (`fix(router): …`), teach `pullRequestScopes` in `shared/src/pull-requests.ts` to read them and `packageLabel` in `app/src/app/profile/packages.ts` what to show. Add a test next to each. Done when a test passes for one of its real PR titles.
4. List it in the README and in "How to become an Angularian" on the home page (`app/src/app/pages/index.page.html`). Done when both name it.
5. `pnpm test`, `pnpm typecheck` and `pnpm build` pass.

## Pull request

- **Branch:** `feat/repo-<name>`.
- **Title:** `feat(shared): count <owner/name>`, with no trailer lines.
- **Body:** link the agreed issue ("Fixes #123") and say that the next nightly run collects its full history.
