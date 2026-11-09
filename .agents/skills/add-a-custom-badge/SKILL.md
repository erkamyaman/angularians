---
name: add-a-custom-badge
description: Add a custom project badge to Angularians (a project's logo, a short fun title and its colour, on its people's profiles and cards) and open the pull request. Use when someone asks to add a badge for their Angular library, tool, community or course, or to act on a "Badge request" issue.
---

# Add a custom badge

A custom badge shows a project's logo, a short title and its colour on its people's profiles and Angularian cards, and links to the project. All of them are in `app/src/app/profile/project-badges.ts`.

## 1. Gather what you need

Ask for anything missing; never guess it. The "Badge request" issue form asks for the same things.

| What | Why |
| --- | --- |
| Each person's GitHub username and role (`creator`, `co-creator`, `founder`, `co-founder`, `maintainer`, `organizer` or `lead organizer`) | who wears it |
| Project name | the tooltip |
| Website, its main page | where the badge links |
| GitHub repository (required for a library or a tool) | to check the project and the role |
| A link that proves the role | contributors, README, team page |
| What it does, one line, about 60 characters | the tooltip |
| The official logo, SVG best, else a square PNG of 128×128 or more | the badge's image |
| Brand colour, as a hex (optional: else pick the logo's main colour) | the badge's tint |
| A title idea | optional |

Check the project is for Angular developers, public and maintained. If it isn't, stop and say why.

Done when every row not marked optional has an answer (the repository only for a library or a tool) and the proof link shows each person's role. Missing one: ask, and wait.

## 2. Make the change

1. **Logo.** Save it unchanged as `app/public/credits/<project>.svg` (or `.png`), the file name in kebab case. Don't redraw or recolour it.
2. **GitHub ids.** For each person run `gh api users/<username> -q .id`. Use their name as GitHub shows it.
3. **Entry.** Add one to `PROJECT_BADGES` in `app/src/app/profile/project-badges.ts`, after the last one, in the same shape:

   ```ts
   { name: 'Project', badge: 'Short fun title', tone: '<project>', href: 'https://project.dev', logo: '/credits/project.svg', does: 'What it does', people: [
     { githubId: 123, username: 'login', name: 'Their Name', role: 'creator' },
   ] },
   ```

   - **`badge`.** Two or three words, playful, about what the project does ("Analog alchemist", "Icon smith", "Slide master"). Use a word other badges don't already use. Don't use the plain role ("Creator"): the one exception is the badge of Angularians' own creator. A conference or a community is different: its badge is its real name and the role ("NG Poland organizer"), never a joke, with `badgeIsOfficial: true`.
   - **`tone`.** The project's name in kebab case. Add its colours to `app/src/app/profile/badge-pill.css`, after the other projects, built from the brand colour `C` like theirs: `--pill-bg: color-mix(in oklab, C 10%, transparent)`, `--pill-text: L`, `--pill-ring: color-mix(in oklab, C 30%, transparent)` in `.tone-<project>`, then `--pill-text: D` and `--pill-ring: color-mix(in oklab, C 40%, transparent)` in `:host-context(.dark) .tone-<project>`. `L` is `C` darkened until it has 4.5:1 contrast on white. `D` is `C` lightened until it has 4.5:1 on `#0a0a0a`. Add the same `C` and `D` to `TAG_COLORS` in `app/src/server/card/tag-colors.ts`: the card has no theme.
   - **`builtOn`.** Leave it out. It is only for the tools Angularians itself runs on.
4. **Notices.** Add the logo's credit to `THIRD_PARTY_NOTICES.md`, under "Credited logos".
5. **Data.** Leave `data/` as the collector wrote it.

Done when the logo, the entry, the tone's light and dark colours and the notice are all in.

## 3. Check it

```sh
pnpm test
pnpm typecheck
pnpm build
pnpm dev
```

With `pnpm dev` running, open:
- `/<username>`: the badge shows with the logo and title, its tooltip reads "<Role> of <Project>", and clicking it opens the website.
- Both themes, and phone width.
- `/<username>/card.png`: the badge shows under the stats, with its logo, title and colour.

Done when the test, typecheck and build pass and each page above shows the badge as described.

## 4. Open the pull request

- **Branch:** `feat/<project>-badge`.
- **Commit and PR title:** `feat(app): the <project> badge`, with no trailer lines.
- **PR body:** fill in `.github/PULL_REQUEST_TEMPLATE.md`. Link the project, the proof of each role and the badge request issue ("Fixes #123"). Add a screenshot of the badge in both themes.
- **One badge per pull request.**

The maintainer decides which badges join and may change the title or colour.
