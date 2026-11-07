import type { ContributorProfile } from '@angularians/shared'

/** Links set on a GitHub profile, by provider (`generic` and unknown ones: a link icon). */
const SOCIAL_ICONS: Record<string, string> = {
  twitter: 'simpleX',
  bluesky: 'simpleBluesky',
  linkedin: 'remixLinkedinBoxLine',
  mastodon: 'simpleMastodon',
  youtube: 'simpleYoutube',
  twitch: 'simpleTwitch',
  instagram: 'simpleInstagram',
  facebook: 'simpleFacebook',
  threads: 'simpleThreads',
  reddit: 'simpleReddit',
  npm: 'simpleNpm',
}

export interface ProfileLink {
  url: string
  label: string
  icon: string
  rel: string
}

/** The GitHub profile, the website and the social accounts of a contributor, one per URL. */
export function profileLinks(person: ContributorProfile): ProfileLink[] {
  // Links set on GitHub are user input: never followed by crawlers. `me` for Mastodon verification.
  const rel = 'me nofollow noopener noreferrer'
  const all = [
    { url: `https://github.com/${person.username}`, label: `github.com/${person.username}`, icon: 'simpleGithub', rel: 'me noopener' },
    ...(person.website ? [{ url: person.website, label: 'Website', icon: 'remixLinkM', rel }] : []),
    ...person.socialAccounts.map(account => ({ url: account.url, label: account.displayName, icon: SOCIAL_ICONS[account.provider] ?? 'remixLinkM', rel })),
  ]
  // A website can also be a social account: one icon per URL, the first wins.
  const same = (url: string) => url.toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '')
  return all.filter((link, index) => all.findIndex(other => same(other.url) === same(link.url)) === index)
}
