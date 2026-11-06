---
name: add-a-recognition
description: Give an Angularian the Angular GDE or GitHub Star badge, by adding their GitHub id to the hand-kept lists. Use when someone asks for a GDE or GitHub Star badge, or acts on a "Recognition request" issue.
---

# Add a recognition

The Angular GDE and GitHub Star badges come from two lists of GitHub ids in `app/src/app/profile/recognitions.ts`. Its header comment names the official source of each list; that source is the proof.

## 1. Confirm it

1. Find the person in the official source the header names.
2. Match that entry to a GitHub account: the GitHub link on their card, else the same name on a GitHub profile.
3. Check they are on the board: `/<username>` on the site shows a profile.

Done when you hold the source link, the GitHub username, and a profile on the board. Missing any one: stop and report which, since only people on the board get the badge.

## 2. Add it

1. Get the id: `gh api users/<username> -q .id`. Ids stay put when a username changes.
2. Add `<id>, // <username>` to `ANGULAR_GDES` or `GITHUB_STARS`, in the list's order (alphabetical by username, ignoring case).
3. When you refresh a whole list, update its "as of <month year>" line too.

Done when the id is in the right list, in order, and `/<username>` with `pnpm dev` shows the badge.

## 3. Open the pull request

- `pnpm test` and `pnpm typecheck` pass.
- **Branch:** `chore/recognition-<username>`.
- **Title:** `chore(app): <username> is an Angular GDE` (or a GitHub Star), with no trailer lines.
- **Body:** the source link and "Fixes #123" for the request. One person per pull request, or one for a whole list refresh.
