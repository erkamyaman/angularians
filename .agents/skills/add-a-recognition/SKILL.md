---
name: add-a-recognition
description: Give an Angularian the Angular GDE, GitHub Star or Nx Champion badge, by adding their GitHub id to the hand-kept lists. Use when someone asks for a GDE, GitHub Star or Nx Champion badge, or acts on a "Recognition request" issue.
---

# Add a recognition

The Angular GDE, GitHub Star and Nx Champion badges come from lists of GitHub ids in `app/src/app/profile/recognitions.ts` (its fourth list, `ANGULAR_SECURITY`, gives the Shieldwall badge to those credited on Angular security advisories). Its header comment names the official source of each list; that source is the proof.

## 1. Confirm it

1. Find the person in the official source the header names.
2. Match that entry to a GitHub account. An Angular GDE or a GitHub Star: the GitHub link on their card, else the same name on a GitHub profile. An Nx Champion (the page gives names only): the same name on a profile on the board, else a GitHub profile that links the X handle the page gives.
3. For a GitHub Star, check they are on the board: `/<username>` on the site shows a profile. An Angular GDE or an Nx Champion can join the list before, so the badge shows the day they are on the board.

Done when you hold the source link and the GitHub username, plus a profile on the board for a Star. Missing one: stop and report which.

## 2. Add it

1. Get the id: `gh api users/<username> -q .id`. Ids stay put when a username changes.
2. Add it in the list's order (alphabetical by username, ignoring case): `[<id>, '<handle>'], // <username>` to `ANGULAR_GDES`, where the handle is the end of their `me.developers.google.com/u/<handle>` profile (`null` if it is not in the directory); `<id>, // <username>` to `GITHUB_STARS` or `NX_CHAMPIONS`.
3. When you refresh a whole list, update its "as of <month year>" line too.

Done when the id is in the right list, in order, and `/<username>` with `pnpm dev` shows the badge.

## 3. Open the pull request

- `pnpm test` and `pnpm typecheck` pass.
- **Branch:** `chore/recognition-<username>`.
- **Title:** `chore(app): <username> is an Angular GDE` (or a GitHub Star, or an Nx Champion), with no trailer lines.
- **Body:** the source link and "Fixes #123" for the request. One person per pull request, or one for a whole list refresh.
