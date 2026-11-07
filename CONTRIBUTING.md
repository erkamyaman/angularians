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

The app follows the [Angular style guide](https://angular.dev/style-guide); [AGENTS.md](AGENTS.md#rules) lists how it applies here.

## Commit messages

`type(scope): summary`, for example `fix(profile): truncate long names on phones`. The types are `feat`, `fix`, `docs`, `chore`,
`ci`, `build`, `test`, `refactor` and `perf`; the scopes are the package or the part of the site (`app`, `collector`, `shared`,
`profile`, `data`…). Pull requests are squash merged, so the pull request title must follow the same form.

## Adding things

Each common change has a skill in [`.agents/skills/`](.agents/skills): the steps, the rules and the checks, written for people and coding agents alike. An issue form asks for what the change needs, when you would rather someone else made it.

| Change | Skill | Or open an issue |
| --- | --- | --- |
| A custom badge for your project | [`add-a-custom-badge`](.agents/skills/add-a-custom-badge/SKILL.md) | [Badge request](https://github.com/erkamyaman/angularians/issues/new?template=badge-request.yml) |
| The Angular GDE, GitHub Star or Nx Champion badge | [`add-a-recognition`](.agents/skills/add-a-recognition/SKILL.md) | [Recognition request](https://github.com/erkamyaman/angularians/issues/new?template=recognition-request.yml) |
| A bot on the board | [`flag-a-bot`](.agents/skills/flag-a-bot/SKILL.md) | [Bot report](https://github.com/erkamyaman/angularians/issues/new?template=bot-report.yml) |
| A repository on the board | [`add-a-repository`](.agents/skills/add-a-repository/SKILL.md) | an issue first: the maintainer decides |
| The score | [`change-the-score`](.agents/skills/change-the-score/SKILL.md) | an issue first: it moves every rank |
| Any change to the site, before the PR | [`check-a-site-change`](.agents/skills/check-a-site-change/SKILL.md) | |

Badges are in `earnedBadges()` of `app/src/app/profile/earned-badges.ts`, which both the profile page and the card use; the project badges are in `app/src/app/profile/project-badges.ts`. The projects marked `builtOn` are the tools Angularians itself runs on: they show in the home page's "Built on" section, and their creators also get "Smith of ng-halla". The mark is built by `app/scripts/logo/build.py`: change it there and regenerate its uses (see the script). Colours are the theme's variables (`--primary`, `--muted-foreground`, …), set for light and dark in `app/src/styles.css`; classes several components share (the GitHub colours, the podium, the guides) are in `app/src/styles/`, and everything else is in the component's own `.css`. GitHub's colours for the kinds of contribution (purple, red, blue, gold, green, pink, orange) are variables in `app/src/styles.css` (`--github-*` in the page's theme, `--github-*-on-light` the light one in both themes), with a `github-*` class for each as the text colour in `app/src/styles/github-colors.css`; `GithubColor` (`app/src/app/leaderboard/github-color.ts`) lists the names.

## Pull requests

- Keep a pull request to one change, with tests and docs.
- Fill in the template.
- Open an issue first for large changes, so we can agree on the approach.

## Recognising contributions

Everyone who helps is listed in the Contributors section of the README, whatever the kind of help: code, docs, design, review or
triage. To add someone, comment `@all-contributors please add @user for code` on an issue or pull request (use another type such
as `doc`, `design`, `review` or `bug` when it fits). The bot opens a pull request that updates `.all-contributorsrc` and the README.
