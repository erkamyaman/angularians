/** The public address of the site: shared links, the README card, og:image (which must be absolute). */
export const SITE_URL = 'https://angularians.dev'

/** The site's repository on GitHub. */
export const REPO_URL = 'https://github.com/erkamyaman/angularians'

/** Who made the site, for search engines (schema.org `Person`): the author of every page. */
export const SITE_AUTHOR = {
  '@type': 'Person',
  name: 'Erkam Yaman',
  url: 'https://erkamyaman.dev',
  sameAs: ['https://github.com/erkamyaman', `${SITE_URL}/erkamyaman`],
} as const

/** The site as schema.org sees it, made by its author: on the home page, and the site every page is part of. */
export const SITE_SCHEMA = { '@type': 'WebSite', name: 'Angularians', url: `${SITE_URL}/`, inLanguage: 'en', author: SITE_AUTHOR, creator: SITE_AUTHOR } as const

/** The home page's description, and the site's for search engines. */
export const SITE_DESCRIPTION = 'Everyone who has contributed to Angular since 2014, ranked: merged pull requests, issues, comments and code reviews in angular/angular, Components, the CLI, dev-infra, Domino, zone.js and Universal.'

/** The home page's title: the name, then what the site is, for search results. */
export const SITE_TITLE = 'Angularians · Every Angular contributor, ranked'

/** A post the home page's callout links to. */
export interface LaunchPost {
  title: string
  href: string
}

/** The launch post; `null` hides the home page's callout until the post is out. */
export const LAUNCH_POST: LaunchPost | null = null
