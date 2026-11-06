# Architecture

A pnpm workspace of three packages and the data they share.

| Folder | |
| --- | --- |
| [`shared/`](../shared) | Types, scoring, PR type rules, periods, countries, the repositories on the board. Used by both others. |
| [`collector/`](../collector) | Collects landed PRs, issues, comments, review comments and GitHub profiles, writes `data/`. Runs nightly in GitHub Actions. |
| [`app/`](../app) | The site: [Analog](https://analogjs.org) (Angular 22, server-rendered), [spartan/ui](https://www.spartan.ng), Tailwind 4. |
| [`data/`](../data) | The collector's output: `contributors*.json`, `profiles.json`, `packages.json`, `team.json`, `meta.json`. Committed. |

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

The data is read once per server instance from a JSON file next to the server (`app/scripts/bundle-data.ts` writes it,
`app/scripts/copy-data.ts` copies it there): at ~25 MB it is too big to compile into the server.

Pages load their data with `injectSeededServerFn` (`app/src/app/data/seeded-server-fn.ts`), not Analog's
`injectServerFn`: it hands the browser the server's value on the first render, so hydration keeps the server-rendered page
instead of rebuilding it. Later inputs load as usual.

To try the site with another data folder: `CONTRIBUTORS_DATA_DIR=/path/to/data pnpm build`.

The brand font, Norse Bold (the word "Angularian" on the site and the cards), is in `app/public/fonts/`. The mark is built by `app/scripts/logo/build.py`.

## Search engines

- `/sitemap.xml` (`app/src/server/routes/sitemap.xml.get.ts`): the home page, each country's board and the profile of
  everyone with a merged PR, dated with the last collection. `robots.txt` points to it and keeps crawlers out of `/api/`.
- One address per page: `angularians.netlify.app` and a trailing slash (`/erkamyaman/`) answer 301 to the canonical URL
  (`app/src/server/middleware/canonical-url.ts`); every page sets `<link rel="canonical">`. A period (`?period=`) is the
  same page as all time; a country (`?country=TR`) is a page of its own, with its own title.
- Structured data (`setJsonLd` in `app/src/app/site.ts`): `WebSite` on the home page, `ProfilePage` with its `Person`
  and a `BreadcrumbList` on profiles, a `BreadcrumbList` on a country's board.
- The cards (`/og.png`, `/:username/card.png`) keep their bottom-left corner free: X lays the page's title over it.

## Sign in with GitHub

Through the user authorization of the `angularians-collector` GitHub App. Only the GitHub id and login are kept, in a sealed,
http-only cookie; GitHub's access token is used once, to ask who signed in. The session is read in the browser
(`/api/auth/me`), never in a cached page. Sign-in stays hidden until the site has these environment variables:

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
