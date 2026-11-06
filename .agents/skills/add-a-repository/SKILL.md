---
name: add-a-repository
description: Maintainer recipe for adding a repository to the board, after its issue is agreed.
disable-model-invocation: true
---

# Add a repository

Only repositories of the `angular` organization join the board, and only after the maintainer agrees in an issue.

## Steps

1. Add `owner/name` to `REPOS` in `shared/src/repos.ts`, in the order the site should list it. Done when it is in the list.
2. Add it to `.github/workflows/collect.yml`, in the same shape as the others: the job matrix, the list the merge job loops over, and, for a small repository, the condition that gives it the built-in token (and the comment above the jobs). Done when the matrix and the merge loop have one entry per repository in `REPOS`, in its order.
3. If its PR titles name packages (`fix(router): …`), teach `pullRequestScopes` in `shared/src/pull-requests.ts` to read them, `packageRepo` there which repository a package belongs to, and `packageLabel` in `app/src/app/profile/packages.ts` what to show. Add a test next to each. Done when a test passes for one of its real PR titles.
4. List it wherever the repositories are named: the README, `collector/README.md`, the "Data" section of `THIRD_PARTY_NOTICES.md`, and on the home page "How to become an Angularian" (`app/src/app/pages/index.page.html`) and the description (`SITE_DESCRIPTION` in `app/src/app/pages/index.page.ts`). The "How the score works" dialog reads `REPOS` itself. Done when each names it.
5. `pnpm test`, `pnpm typecheck` and `pnpm build` pass.

## Pull request

- **Branch:** `feat/repo-<name>`.
- **Title:** `feat(shared): count <owner/name>`, with no trailer lines.
- **Body:** link the agreed issue ("Fixes #123") and say that the next nightly run collects its full history.
