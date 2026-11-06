---
name: add-a-recognition
description: Give an Angularian the Angular GDE or GitHub Star badge, by adding their GitHub id to the hand-kept lists. Use when someone asks for a GDE or GitHub Star badge, or acts on a "Recognition request" issue.
---

# Add a recognition

The Angular GDE and GitHub Star badges come from two lists of GitHub ids in `app/src/app/profile/recognitions.ts`. Its header comment names the official source for each list; that source is the proof.

## 1. Confirm it

1. Find the person in the official source: https://g.dev/experts?specialization=angular for a GDE (Angular is their specialization), https://stars.github.com/profiles for a GitHub Star.
2. Match the source to a GitHub account: the GitHub link on their card, else the same name on a GitHub profile.
3. Check they are on the board: `/<username>` on the site shows a profile.

Done when you hold the source link, the GitHub username, and a profile on the board. Missing any one: stop and report which, since only people on the board get the badge.

## 2. Add it

1. Get the id: `gh api users/<username> -q .id`. Ids stay put when a username changes.
2. Add `<id>, // <username>` to `ANGULAR_GDES` or `GITHUB_STARS`, keeping the list's order (alphabetical by username, case-insensitive).
3. When you refresh a whole list, update its "as of <month year>" line too.

## 3. Check and open the pull request

- `pnpm test` and `pnpm typecheck` pass; `/<username>` with `pnpm dev` shows the badge.
- **Branch:** `chore/recognition-<username>`.
- **Title:** `chore(app): <username> is an Angular GDE` (or a GitHub Star), with no trailer lines.
- **Body:** the source link. One person per pull request, or one pull request for a whole list refresh.
