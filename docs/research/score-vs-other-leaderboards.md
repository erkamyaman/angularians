# The score compared with other contributor leaderboards

Research notes, 2026-11-07. Terms follow [GLOSSARY.md](../../GLOSSARY.md): landed pull request, helpful issue,
helpful comment, review comment, reaction received, security report, period, bot, badge, score, board.

Sources, pinned to the commits read on 2026-11-07:

- Angularians: this repository at `c3285ea` (links below are relative).
- Nuxters collector: [nuxt/nuxters@e733566](https://github.com/nuxt/nuxters/tree/e733566979075b5f858c90a2af40c73209b55499), `scripts/collect-contributors.ts` (cited as **N** + line).
- Nuxters site: [nuxt/nuxt.com@c536f06](https://github.com/nuxt/nuxt.com/tree/c536f0625e879ba1e0b3c63c0716c4c27ba40415) (cited as **C** + file + line), and the live page <https://nuxt.com/nuxters>.
- Astro Badges: [delucis/astro-badge@89c5af4](https://github.com/delucis/astro-badge/tree/89c5af49b356ffe3ff111b40e6cbea8ec28b30b0) (cited as **A** + file + line), live at <https://astro.badg.es>.

## Which leaderboards exist

| Framework | Contributor leaderboard | Source |
| --- | --- | --- |
| Nuxt | Nuxters, a weighted score per period | [N](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts), [nuxt.com/nuxters](https://nuxt.com/nuxters) |
| Astro | Astro Badges: achievements, and contributors listed by an unweighted count. Lives in the personal account of an Astro maintainer, not the `withastro` org | [A README](https://github.com/delucis/astro-badge/blob/89c5af49b356ffe3ff111b40e6cbea8ec28b30b0/README.md), [astro.badg.es](https://astro.badg.es) |
| Vue, Svelte, Solid | None found. No repository of the `vuejs`, `sveltejs` or `solidjs` orgs has "contribut", "leaderboard", "badge" or "fame" in its name or description (GitHub API listing of each org's public repositories, 2026-11-07), and a web search found none | [github.com/vuejs](https://github.com/vuejs), [github.com/sveltejs](https://github.com/sveltejs), [github.com/solidjs](https://github.com/solidjs) |

The absence for Vue, Svelte and Solid is a negative result: a community-run board outside those orgs could exist.

## Weights per contribution kind

| Contribution | Angularians | Nuxters | Astro Badges (ranking) |
| --- | --- | --- | --- |
| Landed pull request, feat | 7 ([scoring.ts L8-L13](../../shared/src/scoring.ts#L8-L13)) | 7 ([N L440-L445](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts#L440-L445)) | 1, any type ([A getContributors.ts L46-L48](https://github.com/delucis/astro-badge/blob/89c5af49b356ffe3ff111b40e6cbea8ec28b30b0/src/util/getContributors.ts#L46-L48)) |
| fix / docs / chore | 5 / 4 / 3 | 5 / 4 / 3 (same lines) | 1 |
| PR without a type in title or labels | chore, 3 ([pull-requests.ts L73-L74](../../shared/src/pull-requests.ts#L73-L74)) | feat, 7 ([N L340](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts#L340)) | 1 |
| Issue | 1 ([scoring.ts L19](../../shared/src/scoring.ts#L19)) | 1 ([N L472](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts#L472)) | 1 |
| Helpful issue (bonus on top of the issue) | +3 ([scoring.ts L17](../../shared/src/scoring.ts#L17)) | +3 ([N L453](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts#L453)) | none |
| Comment | 0.5 ([scoring.ts L21](../../shared/src/scoring.ts#L21)) | 0.5 ([N L473](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts#L473)) | not counted |
| Helpful comment (bonus) | +2 ([scoring.ts L18](../../shared/src/scoring.ts#L18)) | +2 ([N L454](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts#L454)) | none |
| Reaction received | 0.1 ([scoring.ts L22](../../shared/src/scoring.ts#L22)) | 0.1 ([N L474](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts#L474)) | not counted |
| Review comment | 1 ([scoring.ts L20](../../shared/src/scoring.ts#L20)) | not collected (only `issues.listCommentsForRepo`, [N L377](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts#L377)) | 1 per PR reviewed, see below |
| Security advisory credit | Base: 30 analyst or remediation developer; 20 finder or reporter; 10 remediation reviewer; 1 other role. Every role: ×1 low, ×2 moderate, ×3 high, ×5 critical ([scoring rules](../SCORING.md#everything-else)) | none | none |
| Translation segment edited / verified / rejected | none | 1 / 0.5 / 0.5, in `nuxt/translations` ([N L28-L32](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts#L28-L32), [N L456-L460](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts#L456-L460)) | none |
| Core repositories bonus | none ([scoring.ts L3](../../shared/src/scoring.ts#L3)) | landed PRs, helpful issues and helpful comments in `nuxt/nuxt`, `nuxt/framework`, `nuxt/docs` count twice ([N L20-L25](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts#L20-L25), [N L476-L477](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts#L476-L477)) | none |
| Rounding | sum rounded once ([scoring.ts L54](../../shared/src/scoring.ts#L54)) | sum rounded once ([N L478](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts#L478)) | integer count |

The nuxt.com breakdown dialog shows the same base rows, translation rows and core bonus rows
([C shared/utils/nuxters.ts L397-L419](https://github.com/nuxt/nuxt.com/blob/c536f0625e879ba1e0b3c63c0716c4c27ba40415/shared/utils/nuxters.ts#L397-L419)).
The live page states no formula; it says people are ranked by their contributions ([nuxt.com/nuxters](https://nuxt.com/nuxters)).

## PR types

- Nuxters: title prefixes `docs fix feat chore ci build test refactor style perf`, each followed by space, `(` or `:`
  ([N L302-L313](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts#L302-L313)), then labels
  ([N L315-L326](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts#L315-L326)), then `feat`.
- Angularians: the same prefixes and labels, plus `release` and `revert` as chores, `!` allowed after the type, and leading tags such as `[19.2.x]` skipped
  ([pull-requests.ts L10-L36](../../shared/src/pull-requests.ts#L10-L36), [L48-L54](../../shared/src/pull-requests.ts#L48-L54)); fallback `chore`.
- Astro Badges: no PR type; merged PRs are tallied per repository and per label for achievements
  ([A scripts/collect-stats.ts L61-L77](https://github.com/delucis/astro-badge/blob/89c5af49b356ffe3ff111b40e6cbea8ec28b30b0/scripts/collect-stats.ts#L61-L77)).

## What counts as merged

- Nuxters: `merged_at` set on `pulls.list` only, counted on the day it merged
  ([N L343-L358](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts#L343-L358), [N L265-L277](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts#L265-L277)).
- Angularians: a landed pull request is `merged_at`, **or** a default-branch commit with `PR Close #N`, **or**, before a repository's first
  `PR Close`, a commit with a GitHub closing keyword for N; dated by the earliest such commit
  ([pull-requests.ts L159-L245](../../shared/src/pull-requests.ts#L159-L245), [SCORING.md L41-L48](../SCORING.md#L41-L48)).
  This matters for Angular because its merge tooling closes PRs instead of merging them; Nuxters' rule would miss most of them.
- Astro Badges: `pull_request.merged_at` on the issues listing
  ([A scripts/collect-stats.ts L63](https://github.com/delucis/astro-badge/blob/89c5af49b356ffe3ff111b40e6cbea8ec28b30b0/scripts/collect-stats.ts#L63)).

## Helpful issue and helpful comment rules

| Rule | Angularians | Nuxters |
| --- | --- | --- |
| Helpful issue | closed as completed, or 3+ reactions, or 5+ comments ([scoring.ts L29-L31](../../shared/src/scoring.ts#L29-L31), [L170](../../shared/src/scoring.ts#L170)) | identical ([N L26-L27](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts#L26-L27), [N L251](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts#L251)) |
| Helpful comment | 3+ reactions ([scoring.ts L33](../../shared/src/scoring.ts#L33), [L184](../../shared/src/scoring.ts#L184)), **or** marked as a discussion's answer ([L193-L197](../../shared/src/scoring.ts#L193-L197)) | 3+ reactions only ([N L292](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts#L292)) |
| GitHub Discussions | counted as issues and comments ([SCORING.md L31-L32](../SCORING.md#L31-L32)) | not collected (REST issues and issue comments only, [N L361-L386](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts#L361-L386)) |

The nuxt.com page says a qualifying comment is one that "answers a question or reviews a PR, with 3+ reactions"
([nuxt.com/nuxters](https://nuxt.com/nuxters)). In the collector, a comment in a PR's conversation counts, but inline review comments are never fetched.

## Reactions

- Both count reactions on issues, PRs and conversation comments for the author, on the date of the item, not of the reaction
  ([N L245-L248](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts#L245-L248), [N L288-L291](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts#L288-L291); [scoring.ts L161-L187](../../shared/src/scoring.ts#L161-L187)).
- Angularians also counts reactions on discussions and discussion comments ([SCORING.md L28](../SCORING.md#L28)); not on review comments ([scoring.ts L199-L204](../../shared/src/scoring.ts#L199-L204)).
- Astro Badges ignores reactions.

## Review comments

- Angularians: each inline review comment is 1 point, no helpful rule, no reactions ([scoring.ts L199-L204](../../shared/src/scoring.ts#L199-L204)); a review's summary is not one ([SCORING.md L25](../SCORING.md#L25)).
- Nuxters: none.
- Astro Badges: a "review" is one PR a person reviewed, from inline review comments or GraphQL `latestReviews(first: 15)`, deduplicated per PR
  ([A scripts/collect-stats.ts L83-L158](https://github.com/delucis/astro-badge/blob/89c5af49b356ffe3ff111b40e6cbea8ec28b30b0/scripts/collect-stats.ts#L83-L158), [L244-L273](https://github.com/delucis/astro-badge/blob/89c5af49b356ffe3ff111b40e6cbea8ec28b30b0/scripts/collect-stats.ts#L244-L273)).
  So Astro weighs a review of a PR like a merged PR or an issue (1 each), whatever the number of comments.

## Periods

| | Angularians | Nuxters | Astro Badges |
| --- | --- | --- | --- |
| Periods | all, 30d, 12m, each year from 2014 ([periods.ts L5-L50](../../shared/src/periods.ts#L5-L50)) | all, 30d, 12m, each year from 2016 ([N L85-L110](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts#L85-L110)) | all time only |
| Default | 12m ([periods.ts L7](../../shared/src/periods.ts#L7)) | 12m ([C shared/utils/nuxters.ts L30](https://github.com/nuxt/nuxt.com/blob/c536f0625e879ba1e0b3c63c0716c4c27ba40415/shared/utils/nuxters.ts#L30)) | n/a |
| Collection | nightly | daily at 03:00 UTC ([nuxters update-contributors.yml L5-L6](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/.github/workflows/update-contributors.yml#L5-L6)) | daily at 00:00 UTC ([A nightly.yml L5](https://github.com/delucis/astro-badge/blob/89c5af49b356ffe3ff111b40e6cbea8ec28b30b0/.github/workflows/nightly.yml#L5)) |

A small difference: Angularians' rolling windows also exclude dates after the collection time (`time <= now`, [periods.ts L45](../../shared/src/periods.ts#L45)); Nuxters only checks the lower bound ([N L100-L103](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts#L100-L103)).

## Scope of repositories

- Angularians: seven named repositories, two archived ([repos.ts L2-L6](../../shared/src/repos.ts#L2-L6)).
- Nuxters: every public, non-fork repository of six orgs, archived ones included ([N L12-L19](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts#L12-L19), [N L432-L433](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts#L432-L433)).
- Astro Badges: every public source repository of `withastro` ([A scripts/collect-stats.ts L180-L188](https://github.com/delucis/astro-badge/blob/89c5af49b356ffe3ff111b40e6cbea8ec28b30b0/scripts/collect-stats.ts#L180-L188), [L300](https://github.com/delucis/astro-badge/blob/89c5af49b356ffe3ff111b40e6cbea8ec28b30b0/scripts/collect-stats.ts#L300)).

## Bot handling

- Nuxters: by login only: `[bot]`, `-bot`, `ghost`, and `codecov-io`, `codecov-commenter`, `nuxtbot`
  ([N L40](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts#L40), [N L163-L168](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts#L163-L168)).
  Contributors are keyed by lowercased login ([N L158](https://github.com/nuxt/nuxters/blob/e733566979075b5f858c90a2af40c73209b55499/scripts/collect-contributors.ts#L158)), so a renamed account splits in two.
- Angularians: the same login rules, plus GitHub's account `type === 'Bot'` and an Angular list
  ([bots.ts L7-L32](../../shared/src/bots.ts#L7-L32)); keyed by GitHub id, so a renamed account stays one ([scoring.ts L128-L132](../../shared/src/scoring.ts#L128-L132)).
- Astro Badges: no bot filter. Its committed data has `renovate[bot]`, `dependabot[bot]`, `github-actions[bot]` and `nightly-bot` among others
  ([A src/data/contributors.json](https://github.com/delucis/astro-badge/blob/89c5af49b356ffe3ff111b40e6cbea8ec28b30b0/src/data/contributors.json)).

## Badges

- Angularians: Angular team; recognitions (Angular GDE, GitHub Star, Nx Champion); Shieldwall; project badges; Smith of ng-halla;
  `#1 in <year>`; Top 10 all time; Reviewer at 100+ review comments ([earned-badges.ts L35-L53](../../app/src/app/profile/earned-badges.ts#L35-L53)).
- Nuxters: the Nuxter badge and Discord role, for one landed PR, helpful issue, helpful comment, or edited or verified translation
  ([C shared/utils/nuxters.ts L433-L437](https://github.com/nuxt/nuxt.com/blob/c536f0625e879ba1e0b3c63c0716c4c27ba40415/shared/utils/nuxters.ts#L433-L437));
  hackathon badges, Module author, Translator (per locale)
  ([C shared/types/nuxters.ts L168-L186](https://github.com/nuxt/nuxt.com/blob/c536f0625e879ba1e0b3c63c0716c4c27ba40415/shared/types/nuxters.ts#L168-L186),
  [C app/pages/nuxters/\[username\].vue L323-L348](https://github.com/nuxt/nuxt.com/blob/c536f0625e879ba1e0b3c63c0716c4c27ba40415/app/pages/nuxters/%5Busername%5D.vue#L323-L348)).
  Profiles also list blog posts and modules, which give no points ([C server/utils/nuxters-blog.ts](https://github.com/nuxt/nuxt.com/blob/c536f0625e879ba1e0b3c63c0716c4c27ba40415/server/utils/nuxters-blog.ts), [C server/utils/nuxters-modules.ts](https://github.com/nuxt/nuxt.com/blob/c536f0625e879ba1e0b3c63c0716c4c27ba40415/server/utils/nuxters-modules.ts)).
- Astro Badges: tiered achievements by count, such as PRs in N repos, reviews, i18n PRs and reviews, PRs per repository
  ([A src/achievements.config.ts](https://github.com/delucis/astro-badge/blob/89c5af49b356ffe3ff111b40e6cbea8ec28b30b0/src/achievements.config.ts)); no score.

## The claim "Nuxters' weights, plus review comments and security reports"

SCORING.md made this claim until November 2026; it now states the differences below. Against Nuxters' current source:

- **Verified**: the base weights are identical. Landed PRs 7/5/4/3, issue 1, helpful issue +3, comment 0.5, helpful comment +2,
  reaction 0.1, the helpful thresholds (completed, 3 reactions, 5 comments; 3 reactions for a comment) and rounding once.
- **Verified**: review comments (1) and security reports (20) are Angularians' additions; Nuxters has neither.
- **Mismatch, not stated in SCORING.md**: Nuxters doubles landed PRs, helpful issues and helpful comments in its core repositories.
  Angularians drops this; only the code comment says so ([scoring.ts L3](../../shared/src/scoring.ts#L3)).
- **Mismatch, not stated anywhere**: Nuxters now scores translation segments (1 / 0.5 / 0.5). Angularians has no counterpart and its
  code comments do not mention it.
- **Mismatch, partly stated**: an untyped PR is 7 points (feat) in Nuxters, 3 (chore) in Angularians. SCORING.md says "else counts as a chore"
  without saying Nuxters differs; the code says so ([pull-requests.ts L73](../../shared/src/pull-requests.ts#L73)).
- **Further additions not in the claim**: GitHub Discussions as issues and comments, accepted answers as helpful comments,
  `release`/`revert` as chores, and the `PR Close` landing rule.

A more exact sentence for SCORING.md would be: "The base weights are those of Nuxters, without its core repository bonus and
translation points, plus review comments, security reports and GitHub Discussions."
