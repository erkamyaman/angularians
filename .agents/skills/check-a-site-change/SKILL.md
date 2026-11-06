---
name: check-a-site-change
description: Check a change to the Angularians site against the repository's rules before committing or opening a pull request. Use after changing anything in app/, before a commit, or when reviewing a site pull request.
---

# Check a site change

The rules live in the "Rules" section of `AGENTS.md`. This skill applies every one of them to the diff, then looks at the result.

## 1. The rules

For every changed file in `app/`, go through each bullet of "Rules" in `AGENTS.md` and mark it pass, fixed, or open (with the file and line).

Done when every rule has a mark for every changed file.

## 2. The commands

`pnpm test`, `pnpm typecheck` and `pnpm build` pass. Done when all three exit cleanly.

## 3. The look

With `pnpm dev` running, open every page the change touches in the light theme, the dark theme and at phone width. For a change to the cards, also open `/<username>/card.png` and `/<username>/card.png?period=<year>`.

Done when every touched page has been seen in all three views.

## 4. Report

List each open item with its file and line, or say that everything passes.
