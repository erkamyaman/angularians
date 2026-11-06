# Contributing to Angularians

Thanks for helping. This page covers how to set up, what to run before a pull request, and where to add the common kinds of change.

By taking part you agree to the [Code of Conduct](CODE_OF_CONDUCT.md). Report security problems privately, as [SECURITY.md](SECURITY.md)
describes. By contributing you agree that your work is licensed under the [MIT license](LICENSE) of this project.

## Set up

You need Node.js 24 (`.nvmrc` names the version CI and Netlify use) and pnpm 10.

```sh
git clone https://github.com/erkamyaman/angularians.git
cd angularians
pnpm install
pnpm dev             # the site at http://localhost:4202, with the data in data/
```

The data is committed in `data/`, so the site needs no GitHub token. Sign-in with GitHub stays hidden until its environment
variables are set (see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)).

## Commands

| command | what it does |
| --- | --- |
| `pnpm dev` | the site, with hot reload |
| `pnpm build` | builds the site to `app/dist/analog` |
| `pnpm test` | unit tests of every package |
| `pnpm typecheck` | TypeScript over every package |
| `pnpm collect -- --since=30d --out=/tmp/test` | a short collection into a test folder (needs `GITHUB_TOKEN`) |

Before a pull request, run `pnpm test`, `pnpm typecheck` and `pnpm build`. For a change to the site, look at it in the browser,
in both themes and at phone width.

## Code style

Small files, plain comments, few dependencies. Comments say why, not what. A new dependency needs a reason in the pull request.

## Commit messages

`type(scope): summary`, for example `fix(profile): truncate long names on phones`. The types are `feat`, `fix`, `docs`, `chore`,
`ci`, `build`, `test`, `refactor` and `perf`; the scopes are the package or the part of the site (`app`, `collector`, `shared`,
`profile`, `data`…). Pull requests are squash merged, so the pull request title must follow the same form.

## Adding things

**A repository on the board.** Add it to `REPOS` in `shared/src/repos.ts` and to the matrix of `.github/workflows/collect.yml`.
If its PR titles name packages, teach `pullRequestScopes` in `shared/src/pull-requests.ts` how, and `packageLabel` in
`app/src/app/profile/packages.ts` what to show. Then list it in the README and "How to become an
Angularian" on the home page. The next nightly run collects its full history.

**The mark or the brand colour.** The mark is built by `app/scripts/logo/build.py`: change it there and regenerate its
uses (see the script). Colours live in `app/src/styles.css`.

**A bot.** When a run's `Possible bots:` line shows an account that is a bot, add it to `KNOWN_BOT_ACCOUNTS` in
`shared/src/bots.ts`. Check its profile first: a few people have "bot" in their username.

**A badge.** Profile badges are in `badges()` of `app/src/app/pages/[username].page.ts`. The Angular GDE and GitHub Star badges
come from hand-kept lists of GitHub ids in `app/src/app/profile/recognitions.ts`: add someone there when they become one.

**A change to the score.** The weights are in `shared/src/scoring.ts`; update [docs/SCORING.md](docs/SCORING.md) and the
"How the score works" section of the home page with them.

## Pull requests

- Keep a pull request to one change, with tests and docs.
- Fill in the template.
- Open an issue first for large changes, so we can agree on the approach.

## Recognising contributions

Everyone who helps is listed in the Contributors section of the README, whatever the kind of help: code, docs, design, review or
triage. To add someone, comment `@all-contributors please add @user for code` on an issue or pull request (use another type such
as `doc`, `design`, `review` or `bug` when it fits). The bot opens a pull request that updates `.all-contributorsrc` and the README.
