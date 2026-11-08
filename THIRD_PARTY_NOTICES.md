# Third-party notices

Angularians is a port of the Nuxters leaderboard. Parts of its code are adapted from these MIT-licensed
projects. Each ported file says where it comes from in a comment at its top.

## nuxt.com

https://github.com/nuxt/nuxt.com: the leaderboard and profile pages, the globe, the country table, the shared
helpers (`app/`, `shared/src/countries.ts`, `shared/src/periods.ts`, `shared/src/files.ts`, `shared/src/scoring.ts`).

```
MIT License

Copyright (c) 2022-2023 NuxtLabs

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## nuxt/nuxters

https://github.com/nuxt/nuxters: the collector, the score weights, the PR type rules, the bot filter and the
location matching (`collector/`, `shared/src/pull-requests.ts`, `shared/src/bots.ts`, `shared/src/location.ts`).

```
MIT License

Copyright (c) 2023 Nuxt

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## spartan/ui

https://github.com/spartan-ng/spartan: the helm components copied into `app/src/ui/` (MIT). Three local changes are
marked in the code: a `buttonAriaLabel` input on the select trigger, the progress indicator filling by value / max, and
the tooltip closing on any scroll, a press of its trigger or a move of its trigger, and opening on keyboard focus only
(it calls the brain tooltip's internal `delay`: check it when upgrading `@spartan-ng/brain`).

## The Angular logo

The gradient Angular icon (`app/src/app/layout/angular-logo.ts`, and on the shared card, `app/src/server/card/card.ts`)
comes from the Angular press kit, https://angular.dev/press-kit: © Google, CC BY 4.0
(https://creativecommons.org/licenses/by/4.0/). It is used unchanged, to name Angular: the Angular team badge, the home
page's text and "Angular contributor" on the card. The Angularians mark is our own.

## The Google Developer Experts mark

The `<>` mark on the Angular GDE badge (`app/public/credits/gde.svg`) is cut, unchanged otherwise, from Google's GDE
lockup on https://developers.google.com/community/experts. It belongs to Google and is used only to name the programme.

## Norse

The word "Angularian(s)" on the site and the cards is set in Norse Bold by Joël Carrouché (https://www.joelcarrouche.net),
and the A of the Angularians mark is its capital A; the README's wordmark draws the word from its outlines. The font file
is `app/public/fonts/Norse-Bold.otf`, unmodified. Its licence (free font EULA v1.0, March 2014) does not allow selling the
font or modifying the files; to use it anywhere else, get it from https://www.joelcarrouche.net.

## Icons

The Viking icons in `app/src/app/layout/viking-icons.ts` are from [Game Icons](https://game-icons.net), under CC BY 3.0
(https://creativecommons.org/licenses/by/3.0/), unmodified:

- by [Delapouite](https://delapouite.com): "Viking helmet", "Viking head", "Viking shield", "Thor hammer", "Broom" and "Drakkar";
- by [Lorc](https://lorcblog.blogspot.com): "Crossed axes", "Scroll unfurled", "Broadsword", "Anvil" and "Raven".

The other icons come through [ng-icons](https://github.com/ng-icons/ng-icons): [Remix Icon](https://remixicon.com)
(`@ng-icons/remixicon`, declared Apache), [Octicons](https://github.com/primer/octicons) (`@ng-icons/octicons`, MIT) and
[Simple Icons](https://simpleicons.org) (`@ng-icons/simple-icons`, CC0 1.0; the brand marks belong to their owners).

## Flags

The round flags in `app/public/flags/` are copied at build time from [circle-flags](https://github.com/HatScripts/circle-flags),
MIT, Copyright (c) 2026 HatScripts. The full licence ships with the package.

## Other software in the site

- [Manrope](https://github.com/sharanda/manrope), the site's font: SIL Open Font License 1.1, Copyright 2019 The Manrope
  Project Authors, through `@fontsource-variable/manrope` (and, for the cards, `app/src/server/card/fonts`).
- [cobe](https://github.com/shuding/cobe), the globe: MIT, Copyright (c) 2021 Shu Ding.
- [satori](https://github.com/vercel/satori) and [resvg-js](https://github.com/yisibl/resvg-js), which draw the cards:
  MPL 2.0, unmodified.

Every other npm dependency keeps its own licence, listed in its package.

## Credited logos

The home page credits the Angular community projects the site is built on with their own logos, unchanged: AnalogJS
(https://github.com/analogjs/analog, MIT), spartan/ui (https://spartan.ng, MIT), ng-icons
(https://github.com/ng-icons/ng-icons, MIT) and ngxtension (https://github.com/ngxtension/ngxtension-platform, MIT),
as the projects show them (ngxtension: its Angular-coloured mark, as on its GitHub), in `app/public/credits/`. They are
their projects' marks, used only to credit them.

The special badges also show, unchanged, the marks of Pangular Inspector (https://pangular-inspector.dev) and slide.ng
(https://slide-ng.dev), projects of this site's author, in `app/public/credits/`.

The badges of Ashley Hunter's Angular Native (https://ng-native.com) and Angular Primitives
(https://angularprimitives.com) show their marks, unchanged, in `app/public/credits/`. Santosh Yadav's ngx-builders
(https://github.com/ngx-builders) shows its GitHub organization avatar, unchanged.

## Data

- Country names and coordinates: [GeoNames](https://www.geonames.org), CC BY 4.0.
- Contributions: the public GitHub API, for the public repositories angular/angular, angular/components,
  angular/angular-cli, angular/dev-infra, angular/domino, and the archived angular/zone.js and angular/universal.
- Avatars are served by GitHub (avatars.githubusercontent.com), not stored here.

Angular is a trademark of Google LLC. This project is not affiliated with Google or the Angular team.
