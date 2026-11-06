---
name: change-the-score
description: Change how Angularians scores contributions (the points per pull request type, issue, comment or review comment) and keep every place that explains the score in step.
disable-model-invocation: true
---

# Change the score

A score change moves every rank, so it starts as an issue the maintainer agrees to.

## Steps

1. Change the weights in `shared/src/scoring.ts` (types and title parsing live in `shared/src/pull-requests.ts`), and the tests next to them.
2. Bring every explanation in step, so each says the same numbers:
   - `docs/SCORING.md`;
   - the "How the score works" section of the home page (`app/src/app/leaderboard/score-rules.*`) reads the points from `shared`, but its wording ("3+ reactions") may need a change;
   - the score dialog and breakdown on profiles (`app/src/app/profile/score-dialog.*`, `score-breakdown.*`);
   - the README, if it quotes points.
3. `pnpm test`, `pnpm typecheck` and `pnpm build` pass. Search the repository for the old numbers to find any explanation left behind.
4. The new scores appear after the next nightly run.

Pull request: branch `feat/score-<what>`, title `feat(shared): <the change>`, and in the body the old and new weights in a table. No trailer lines.
