---
name: flag-a-bot
description: Take a bot account off the Angularians board by adding it to KNOWN_BOT_ACCOUNTS. Use when someone reports a bot on the board, acts on a "Bot report" issue, or reviews a run's "Possible bots:" line.
---

# Flag a bot

A bot leaves the board when its login is in `KNOWN_BOT_ACCOUNTS` in `shared/src/bots.ts`. `isBotAccount` there also catches `[bot]`, a `-bot` suffix and `ghost` by itself. The collector skips these accounts, and the next nightly run writes a board without them.

## 1. Prove it is a bot

Open `https://github.com/<login>` and its activity on the board's repositories. A bot shows at least one of these:
- the GitHub "bot" label;
- a description or README saying it is automated;
- only templated, machine-written PRs or comments (version bumps, CLA checks, merge messages).

A person with "bot" in their username is a person: some contributors have one. Done when you can quote the evidence; anything less, report it and stop.

## 2. Add it

Add the lowercase login to `KNOWN_BOT_ACCOUNTS`, under a short comment saying where it was found, as the other entries do. If the existing rules in `isBotAccount` already match it, the list needs nothing: the report is about data a run will refresh.

The files in `data/` belong to the collector. Removing a bot from them before the next run is the maintainer's call.

## 3. Check and open the pull request

- `pnpm test` and `pnpm typecheck` pass. Add the login to the bot cases in `shared/test/pull-requests.spec.ts`.
- **Branch:** `fix/bot-<login>`.
- **Title:** `fix(shared): <login> is a bot`, with no trailer lines.
- **Body:** the evidence from step 1.
