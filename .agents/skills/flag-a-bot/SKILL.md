---
name: flag-a-bot
description: Take a bot account off the Angularians board by adding it to KNOWN_BOT_ACCOUNTS. Use when someone reports a bot on the board, acts on a "Bot report" issue, or reviews a run's "Possible bots:" line.
---

# Flag a bot

An account leaves the board when `isBotAccount` in `shared/src/bots.ts` matches it: the collector skips it, and the next nightly run writes a board without it.

## 1. Prove it is a bot

Open `https://github.com/<login>` and its activity on the board's repositories. A bot shows at least one of:
- the GitHub "bot" label;
- a description or README saying it is automated;
- only templated, machine-written PRs or comments (version bumps, CLA checks, merge messages).

A person with "bot" in their username is a person. Done when you can quote the evidence; without it, report what you found and stop.

## 2. Check whether it is already caught

Read `isBotAccount`. If it already matches the login, the board drops it on the next nightly run: report that and stop here, with no pull request.

## 3. Add it

1. Add the lowercase login to `KNOWN_BOT_ACCOUNTS`, under a short comment saying where it was found, as the other entries do.
2. Add the login to the `isBotAccount` cases in `shared/test/pull-requests.spec.ts`.

Done when that test passes. The files in `data/` belong to the collector: removing the bot from them before the next run is the maintainer's call.

## 4. Open the pull request

- `pnpm test` and `pnpm typecheck` pass.
- **Branch:** `fix/bot-<login>`.
- **Title:** `fix(shared): <login> is a bot`, with no trailer lines.
- **Body:** the evidence from step 1, and "Fixes #123" for the report.
