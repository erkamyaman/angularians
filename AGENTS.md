# Repository guide

Short orientation for anyone, human or automated tool, who changes this repository. Details are in [CONTRIBUTING.md](CONTRIBUTING.md) and `docs/`.

Angularians ranks everyone who has contributed to the Angular repositories: a collector writes `data/` every night, and an Analog site serves it.

## Map

| path | what is there |
| --- | --- |
| `shared/src` | scoring, PR types and scopes, periods, countries, bots, the repositories on the board |
| `collector/src` | the GitHub client, the collection (`main.ts`), parts and their merge (`finalize.ts`, `merge.ts`), the GitHub App token (`auth.ts`) |
| `app/src/app` | the pages, the leaderboard, profiles, the signed-in card and sharing |
| `app/src/server` | the API, sign-in (`auth/`), the Angularian card (`card/`), the data store |
| `app/src/app/layout` | the header, the footer, the mark (`logo-mark.ts`, its paths in `logo-mark.html`), the hero |
| `app/src/ui` | spartan/ui helm components, copied in and ours to change (`@spartan-ng/helm/*` in tsconfig) |
| `app/scripts/logo` | the mark (`build.py`) and the README wordmark (`wordmark.py`), built from their construction |
| `app/public` | the favicon, the Norse font (`fonts/`) |
| `data/` | written by the collector; never edit by hand, except to remove a bot from a run |
| `.github/workflows/collect.yml` | the nightly collection, one job per repository |
| `.github/labels.json` | the issue labels; `.github/workflows/labels.yml` applies them on main |
| `docs/` | architecture, scoring |
| `.agents/skills/` | skills for common changes: badges, recognitions, bots, repositories, the score, checking a site change |

## Commands

Use Node 24 (`.nvmrc`) and pnpm 10.

```sh
pnpm install
pnpm dev          # the site
pnpm test         # unit tests of every package
pnpm typecheck
pnpm build        # the site, as Netlify builds it
```

## Rules

- Small files, short plain comments, few dependencies.
- A component in `app/src/app` keeps its template in its own `.html` and its styles, if any, in its own `.css`, next to its `.ts`: never inline. No styling in TypeScript: no class lists or styling values in `host`, in constants or in bound `[style.*]`; TypeScript picks a name (a tone, a medal) and the `.css` styles it, in plain CSS with the theme's variables. A `host` or template binding that toggles one named class styled in the component's `.css` (`'[class.wide]': 'wide()'`) is fine. Classes several components share are in `app/src/styles/`. `app/src/ui` is copied from spartan/ui and keeps its form.
- Commit messages are `type(scope): summary`, with no trailer lines.
- Run `pnpm test`, `pnpm typecheck` and `pnpm build` before you commit; look at a change to the site in both themes and at phone width.
- Update `docs/` in the same change as the code.
- Never write secrets, tokens, absolute local paths or personal data into the repository.
- Pages are cached by the CDN for everyone: never render the signed-in user into a page; read it in the browser from `/api/auth/me`.
- No gradients: the brand is Viking gold, in flat colours (the mark's graph uses its shades and a grey).
- Our colours come from the theme (`--primary`, `--color-brand`, `--mark-*`, `--github-*`, `--medal-*` and the other
  groups in `app/src/styles.css`, listed in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#design-tokens)), not a hex in
  a component: both themes recolour everything through them. Fixed hex is only for the four cases listed there
  ([Design tokens](docs/ARCHITECTURE.md#design-tokens)): another project's own colour, the artwork of a logo, black or
  white as a shade, a mask or over a photo, and the server-drawn cards (`app/src/server/card`), which have no theme.
- The word "Angularian(s)" is written with the `brand` utility (the Norse font); on the cards, `branded()` does the same.
- The mark is generated: change `app/scripts/logo/build.py` and regenerate the component (`logo-mark.html`), the favicon, the cards and the
  wordmark, never edit its path data by hand.
- UI: the spartan/ui components in `app/src/ui`, and icons from ng-icons: Remix Icon, Octicons for GitHub's own
  (merges, issues, comments, reactions) and Simple Icons for brands, plus the Viking accents in
  `app/src/app/layout/viking-icons.ts`. No other component or icon library.
- Server rendering: code that needs `window`, `document`, storage or observers runs only in the browser
  (`isPlatformBrowser`, `afterNextRender`, `@defer`).
- Accessibility: every control has a name, icons are `aria-hidden`, and nothing relies on colour alone.
- Branches are `feat/…`, `fix/…`, `docs/…` or `chore/…`; one change per branch.

Adding a custom badge, a recognition or a bot: follow its skill in `.agents/skills/` (the table in [CONTRIBUTING.md](CONTRIBUTING.md#adding-things)). Before committing a site change: `check-a-site-change`. A repository or a score change is the maintainer's: their recipes are `add-a-repository` and `change-the-score`.
