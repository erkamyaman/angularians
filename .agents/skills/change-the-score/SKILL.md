---
name: change-the-score
description: Maintainer recipe for changing the score's weights and keeping every explanation of it in step.
disable-model-invocation: true
---

# Change the score

A score change moves every rank, so it starts as an issue the maintainer agrees to.

## Steps

1. Change the weights in `shared/src/scoring.ts` (types and title parsing are in `shared/src/pull-requests.ts`), and the tests next to them. Done when the tests pass with the new weights.
2. Bring every explanation in step:
   - `docs/SCORING.md`;
   - the "How the score works" dialog that opens from the home page's hero (`app/src/app/leaderboard/score-rules.*`). It reads the points from `shared`, but its wording ("3+ reactions") may need a change;
   - the score dialog and breakdown on profiles (`app/src/app/profile/score-dialog.*`, `score-breakdown.*`);
   - the README, if it quotes points.

   Done when a search of the repository for each old number finds no explanation left behind.
3. `pnpm test`, `pnpm typecheck` and `pnpm build` pass.

## Pull request

- **Branch:** `feat/score-<what>`.
- **Title:** `feat(shared): <the change>`, with no trailer lines.
- **Body:** the old and new weights in a table, and a link to the agreed issue.
