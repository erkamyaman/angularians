# Angularians: the site

[Analog](https://analogjs.org) (Angular 22, server-rendered), [spartan/ui](https://www.spartan.ng) and Tailwind 4.
See the [root README](../README.md) for the project.

```bash
pnpm dev     # http://localhost:4202 (bundles ../data first)
pnpm build   # dist/analog: public/ (static) and server/ (Nitro)
pnpm preview # runs the built server
pnpm test    # Vitest
```

## Where things are

| | |
|---|---|
| `src/app/pages/` | Routes: `index.page.ts` (leaderboard and globe), `[username].page.ts` (profile), `[...not-found].page.ts` |
| `src/app/leaderboard/` | Period tabs, country filter, search, the avatar grid |
| `src/app/profile/` | Score breakdown, sharing, package labels |
| `src/app/world/` | The globe (`cobe`, loaded with `@defer` when it nears the screen) and the country list |
| `src/app/layout/` | Header, footer, theme toggle, page layout pieces |
| `src/app/data/contributors.server.ts` | Server functions the pages call (in-process during SSR) |
| `src/server/routes/` | The public JSON API, sign-in (`api/auth`) and the Angularian card (`[username]/card.png`) |
| `src/server/data/` | The data bundle and its queries, shared by both |
| `src/ui/` | spartan/ui helm components, owned and editable (three local changes, see THIRD_PARTY_NOTICES.md) |
| `scripts/bundle-data.ts` | Validates `../data` and bundles it before `dev`, `build` and `test` |

Every page is server-rendered (no pre-rendering): `/` reads `?period=` and `?country=`.
