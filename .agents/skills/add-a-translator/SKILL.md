---
name: add-a-translator
description: Give a translator of angular.dev the translator badge and its points, or add a new community translation, in the hand-kept list. Use when someone asks for a translator badge, a translation joins angular.dev's "Community translations" footer, or a translation gains a translator.
---

# Add a translator

The translator badge ("Türkçe translator") and a translation's points (20 for its lead, 10 for a helper, see `docs/SCORING.md`) come from `TRANSLATIONS` in `shared/src/translations.ts`: one entry per community translation of angular.dev, with who translated it. The points reach the board with the next nightly collection.

## 1. Confirm it

1. The translation is in angular.dev's footer, under "Community translations", or an open angular/angular pull request adds it there (then `joinedAt` is that pull request's date, and the entry goes after the footer's).
2. Find who translated it in its repository, counting translation work only: these repositories carry Angular's own history, so leave out commits that are Angular's, bots' and syncs with upstream. The lead gets it, and so does everyone with five or more translation commits.

Done when you hold the footer link, the date of the angular/angular commit that added it, the repository and each translator's username with their count of translation commits. Missing one: stop and report which.

## 2. Add it

1. Get each id: `gh api users/<username> -q .id`.
2. A new translation: an entry in `TRANSLATIONS`, in the footer's order, with `language` in that language, its `code` and `flag` (a country in `COUNTRIES` of `shared/src/countries.ts`), `site`, `repository` and `joinedAt` (the day the footer commit landed: its committer date), and its `.tone-lang-<code>` in `badge-pill.css`, built from the flag's main colour as the other languages' are, added to the dark `:is()` list above them too, and to `TAG_COLORS` in `app/src/server/card/tag-colors.ts` for the card. If its name uses letters the card cannot draw yet, the card says only "Translator": `DRAWABLE` and `TAG_FONTS` in `app/src/server/card/tag-fonts.ts` need it (for Korean, Japanese or Chinese, a font from Google Fonts with `text=` set to the name, kept in `app/src/server/card/fonts`). A new translator: `{ githubId: <id>, username: '<username>' }` in its `translators`, with `helper: true` unless they lead it (their badge then says contributor, and they score 10).
3. Update the list's "as of <month year>" line.

Done when the ids are in, `pnpm test` passes, and `/<username>` with `pnpm dev` shows "<language> translator" (or "<language> contributor" for a helper).

## 3. Open the pull request

- **Branch:** `chore/translator-<username>` (or `chore/translation-<language>`), from `development`.
- **Title:** `chore(app): <username> translated angular.dev into <language>`, with no trailer lines.
- **Body:** the footer link, the repository, and each translator's count of translation commits.
