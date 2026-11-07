# Architecture

A pnpm workspace of three packages and the data they share.

| Folder | |
| --- | --- |
| [`shared/`](../shared) | Types, scoring, PR type rules, periods, countries, the repositories on the board. Used by both others. |
| [`collector/`](../collector) | Collects landed PRs, issues, discussions, comments, review comments, security advisories, the Angular team and GitHub profiles, writes `data/`. Runs nightly in GitHub Actions. |
| [`app/`](../app) | The site: [Analog](https://analogjs.org) (Angular 22, server-rendered), [spartan/ui](https://www.spartan.ng), Tailwind 4. |
| [`data/`](../data) | The collector's output: `contributors*.json`, `profiles.json`, `packages.json`, `team.json`, `renames.json`, `meta.json`. Committed. |

## Data

Every night `.github/workflows/collect.yml` collects each repository in a job of its own, in parallel, and a last job merges them
into `data/` and commits it; that commit deploys the site. Details: [collector/README.md](../collector/README.md).

## Site

Angular 22 uses OnPush change detection and standalone components by default; omit explicit declarations of those defaults.
Root services use `@Service()` (available since Angular 22.1), which preserves the application-wide, tree-shakable scope of
`@Injectable({ providedIn: 'root' })`. Keep manual providers when they configure a dependency or give it a local scope.

Every page is server-rendered on Netlify by one function (Nitro's `netlify` preset, configured in [`netlify.toml`](../netlify.toml));
static assets go to the CDN. Pages and API responses are cached by the CDN for an hour, in Netlify's durable cache (`netlify-cdn-cache-control`: one copy shared by every edge), and each deploy clears that cache. Server functions (`/_analog/**`) are `no-store`: they are POSTs whose input is in the body, which the CDN's cache key ignores. Any 5xx answer, a failed render included, is `no-store` (`app/src/server/plugins/no-cache-errors.ts`).
The CDN keeps one copy per value of the parameters the routes read (`netlify-vary` in `app/vite.config.ts`); any other query parameter shares that copy, so a route reading a new one must add it there.
Each page lists its own lazy chunks as `modulepreload` links, so the browser fetches them with the entry instead of after it: the client build's Vite manifest goes to the server as an asset (`app/dist/client-manifest`, never published), and `app/src/server/plugins/preload-page.ts` adds the chunks of the page the path maps to.
Browsers keep `/assets/*` and `/fonts/*` for a year and `/flags/*` for 30 days (`netlify.toml`).

The data is read once per server instance from a JSON file next to the server (`app/scripts/bundle-data.ts` writes it from
`readDataDir` of `@angularians/shared/node`, which validates every file of `data/`; `app/scripts/copy-data.ts` copies it there): at ~25 MB it is too big to compile into the server.

Pages load their data with `injectSeededServerFn` (`app/src/app/data/seeded-server-fn.ts`), not Analog's
`injectServerFn`: it hands the browser the server's value on the first render, so hydration keeps the server-rendered page
instead of rebuilding it. Later inputs load as usual.

A page is hydrated when its route resolves, a moment after the rest of the app, and Angular then writes each element's
static `class` over the server's classes before the spartan/ui directives' first effect sets theirs, with a paint in
between: `classes()` in `app/src/ui/utils/src/lib/hlm.ts` puts the server's classes back until then, or the page's buttons
and tabs would lose their size for a frame and move what is around them. Meanwhile it notes Angular's own classes (the
static ones, and what `[class.x]` bindings add or remove through `classList`), which the first effect keeps.

To try the site with another data folder: `CONTRIBUTORS_DATA_DIR=/path/to/data pnpm build`.

The brand font, Norse Bold (the word "Angularian" on the site and the cards), is in `app/public/fonts/`; it and
Manrope's Latin file are preloaded (`app/index.html`), so the text does not move when they arrive. The mark is built by `app/scripts/logo/build.py`.

On a reload or back/forward, an inline script in `app/index.html` makes the page render-blocking until the footer
(`#site-footer`) is parsed: the browser restores the scroll position in the first paint instead of drawing the top of
the page first. A first visit is not held back.

A launch post, once out, goes in `LAUNCH_POST` (`app/src/app/site.ts`): the home page then shows a dashed callout linking to it under its introduction (`leaderboard/launch-post-callout.ts`).

## Design tokens

The site's colours are variables in [`app/src/styles.css`](../app/src/styles.css), each set there once per theme: its light
value in `:root`, its dark value, when it differs, in `:root.dark` just below. Components use them as `var(--name)` in
their `.css`, or as a utility where `@theme inline` exposes one (`text-brand`, `bg-angular-pink/10`). The only colours
that are not variables are the fixed hex listed below.

| Group | Tokens | Used by |
| --- | --- | --- |
| Spartan's theme | `--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring` (and their `-foreground`), `--radius` | the UI components and every page, as Tailwind utilities (`bg-muted`, `rounded-lg`) |
| The brand | `--primary` (Viking gold: on light the mark's `--mark-2`), `--color-brand` (utility `text-brand`), `--font-display` (Norse) | the mark, the word Angularians |
| The mark | `--mark-empty`, `--mark-1` to `--mark-3` (its graph, the same in both themes), `--mark-intro-1` to `--mark-intro-3` (the greens of its intro and hover) | `logo-mark` |
| Angular | `--angular-pink`, `--angular-purple` (utilities `*-angular-pink`, `*-angular-purple`) | the team badge, the Angular guide |
| GitHub | `--github-purple`, `-red`, `-blue`, `-gold`, `-green`, `-pink`, `-orange`; `--github-*-on-light`, GitHub's light-theme value in both themes; `--github-gold-text`, `--github-green-text`, a shade darker on light for text on a tint | the kinds of contribution, with the `github-*` classes of `styles/github-colors.css`; the profile's stat tints; the gold and green badges |
| Medals | `--medal-gold`, `--medal-silver`, `--medal-bronze` and their `-text` | the top three, through the classes of `styles/podium.css` (which set `--podium-ring` and `--podium-text`) |
| Badges | `--shieldwall` | the Shieldwall badge, for Angular's security advisories (`badge-pill.css`) |
| Projects | `--idea-library`, `--idea-tool`, `--idea-meetup`, `--idea-teaching` | the kinds of project in "Forged something for Angular?" |
| The globe | `--globe-base`, `--globe-glow` (and `--primary` for its land) | the world globe's WebGL colours, read by `world/globe.ts` |
| The storm | `--lightning`, `--lightning-inner`, `--angie-shadow` (the same in both themes) | Angie's storm, `layout/hammer-strike.css` |

A token that means another one is written as it (`--primary: var(--mark-2)`, `--idea-library: var(--github-pink)`,
`--shieldwall: var(--github-red)`). Some share a hex but not a meaning, and stay separate so that one can change
alone: GitHub's gold (`--github-gold`) and the brand (`--primary`), the gold medal (`--medal-gold`, `--medal-gold-text`)
and both, the tool kind of project (`--idea-tool`) and the silver medal's text.

Spacing, font sizes, shadows and z-indexes are Tailwind's own scale (`--spacing`, `--text-*`, `--shadow-*`); a one-off
size for one element (`text-[5.5rem]` for the hero's word) stays an arbitrary value where it is used.
Spartan's preset also maps sidebar and chart colours (`--color-sidebar*`, `--color-chart-*`) to variables this theme
does not set; `@theme inline` in `styles.css` unmaps them, so `bg-sidebar` makes no CSS rather than a transparent colour.

Fixed hex stays only where no theme applies, in four cases (AGENTS.md lists the same):

1. another project's own colour (a badge's tone in `badge-pill.css`, the Discord and YouTube guides), set once in a
   variable on the element when it is used more than once;
2. the artwork of a logo (`angular-logo.html`, YouTube's);
3. black or white as a shade, a mask or over a photo (the rank shield's darker half, the globe's fade, the leaderboard's
   names on avatars);
4. the server-drawn cards (`app/src/server/card` and their preview in the share dialog), which have no theme.

To add a colour: give it a name for what it is, not how it looks (`--medal-gold`, not `--yellow`), put it in its group in
`styles.css` with its dark value next to it if it changes, add a `--color-*` line to `@theme inline` only when a template
needs it as a utility, and remove any token nothing uses any more.

An easter egg: the word "Angularian(s)" or "ng-halla", or a click on the header's or footer's logo, calls Angie (`app/public/angie/`) to bring down a storm with thunder (`app/public/sounds/`), on a click on the word, once a visit on a click on a logo, or once a visit on hover after a first click; `app/src/app/layout/hammer-strike.ts`, the bolt's shape in `lightning.ts`.

## Search engines

- `/sitemap.xml` (`app/src/server/routes/sitemap.xml.get.ts`): the home page, each country's board and the profile of
  everyone with a merged PR, dated with the last collection. `robots.txt` points to it and keeps crawlers out of `/api/`.
- One address per page: `angularians.netlify.app` and a trailing slash (`/erkamyaman/`) answer 301 to the canonical URL
  (`app/src/server/middleware/canonical-url.ts`); every page sets `<link rel="canonical">`. A period (`?period=`) is the
  same page as the home page without one (the last 12 months); a country (`?country=TR`) is a page of its own, with its own title.
- Structured data (`setJsonLd` in `app/src/app/seo-head.ts`): `WebSite` on the home page, `ProfilePage` with its `Person`
  and a `BreadcrumbList` on profiles, a `BreadcrumbList` on a country's board.
- The cards (`/og.png`, `/:username/card.png`) keep their bottom-left corner free: X lays the page's title over it.
- Renamed accounts: each run compares usernames with the previous run's by GitHub id and keeps the old ones in
  `data/renames.json`. `/oldname` and `/oldname/card.png` answer 301 to the new name
  (`app/src/server/middleware/renamed-user.ts`), so a README card keeps working; a name someone contributes under now
  stays theirs.

## Sign in with GitHub

Through the user authorization of the `angularians-collector` GitHub App. Only the GitHub id and login are kept, in a sealed,
http-only cookie; GitHub's access token is used once, to ask who signed in. The session is read in the browser
(`/api/auth/me`), never in a cached page. A readable hint cookie, `angularians-signed-in` (`app/src/app/auth/hint.ts`),
says the browser was signed in last time; the CDN keeps a copy of each page per value, so the server draws the signed-in
card's skeleton (laid out as an Angularian's card, at its height, and the card is never shorter) and the header's avatar
place, and leaves out the profile's "Is this your profile?" prompt for it, and draws the sign-in and the prompt for
everyone else: nothing jumps when the session answers. A hint whose session has ended gets the sign-in in the skeleton's
place and size, and in the avatar's, once: `/api/auth/me` clears it. A session check that fails counts as signed out,
so the page stays as the server drew it.
Sign-in stays hidden until the site has these environment variables; without them the server draws the page without
the sign-in and the prompt (`SIGN_IN_SET_UP`, a fact about the site, not the visitor):

| Variable | |
| --- | --- |
| `GITHUB_CLIENT_ID` | The GitHub App's client id |
| `GITHUB_CLIENT_SECRET` | One of its client secrets |
| `SESSION_SECRET` | 32 characters or more, to seal the cookie |

The App's callback URL is `https://angularians.dev/api/auth/callback`. To sign in locally, add `http://localhost:4202/api/auth/callback` as well.

The App must be public: GitHub answers 404 to everyone but its owner when it is private.

Signing in from the home page ends on your profile, or back on the home page if you have no contributions. From any other page, it ends on that page.

## Public API

| Route | |
| --- | --- |
| `GET /api/contributors?period=12m&country=TR&page=1` | One page (100) of the leaderboard, with each profile's name when it has one; filtered on a country, also each row's `countryRank` |
| `GET /api/contributors/:username` | A profile: all-time stats, rank in each period, links |
| `GET /api/search/contributors?q=cris&country=TR` | Up to 8 contributors, of that country if given |
| `GET /api/map/contributors?period=all` | Contributors by country |
| `GET /:username/card.png?period=2025&flag=TR` | The Angularian card, 2400×1260: the README card and the profile's link preview. Its flag is the GitHub location's country, or `flag` when the owner picked another; its footer shows the profile's badges as icons (`earnedBadges` in `app/src/app/profile/earned-badges.ts`, shared with the profile page; images from the `site-images` server asset) |
| `GET /og.png?period=2025` | The home page's link preview, 2400×1260: all time, or the top of a period |
