---
name: check-a-site-change
description: Check a change to the Angularians site against the repository's rules before committing or opening a pull request. Use after changing anything in app/src, before a commit, or when reviewing a site pull request.
---

# Check a site change

`AGENTS.md` holds the rules; this is the pass that applies them to a diff. Work through every check on every changed file in `app/`, then report each one as pass, fixed, or still open with the file and line.

## Checks

1. **Commands.** `pnpm test`, `pnpm typecheck` and `pnpm build` pass.
2. **Files.** A component in `app/src/app` keeps its template in its own `.html` and its styles in its own `.css`, next to its `.ts`. `app/src/ui` keeps spartan/ui's form.
3. **Colours.** Our colours come from the theme (`--primary`, `--color-brand-from`, `--mark-*` and the other tokens in `app/src/styles.css`). A hex in a component is fine only for another project's brand colour; the server cards in `app/src/server/card` use hex since they have no theme. Flat colours only, never a gradient of ours.
4. **The brand word.** "Angularian(s)" on the site uses the `brand` utility; on the cards, `branded()`.
5. **Icons.** ng-icons only: Remix Icon, Octicons for GitHub's own things, Simple Icons for brands, and the Viking icons in `app/src/app/layout/viking-icons.ts`. Each icon is `aria-hidden`.
6. **Accessibility.** Every control has a name. Meaning never rides on colour alone. Focus is visible.
7. **Server rendering.** Code using `window`, `document`, storage or observers runs only in the browser (`isPlatformBrowser`, `afterNextRender`, `@defer`). The signed-in user is read in the browser from `/api/auth/me` and never rendered into a page, since the CDN caches pages for everyone.
8. **Looks.** With `pnpm dev`, look at every changed page in the light and dark themes and at phone width (375px). A changed card: open `/<username>/card.png` and `/<username>/card.png?period=<year>`.
9. **Docs.** `docs/`, `CONTRIBUTING.md` and the README match the change.
10. **Hygiene.** No secrets, tokens, absolute local paths or personal data; short, plain comments.

Done when all ten are pass or fixed, or the open ones are reported to the person.
