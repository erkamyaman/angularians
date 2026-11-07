import type { ContributorProfile } from '@angularians/shared'
import { avatarUrl } from '../contributors/avatar-url'
import { breadcrumbs } from '../seo-head'
import { SITE_SCHEMA, SITE_URL } from '../site'

/**
 * A profile page about a person (the GitHub account; its other links are user input, so not vouched for here), and
 * its place in the site, for search results.
 */
export function profileJsonLd(person: ContributorProfile, head: { title: string, description: string }): object {
  const url = `${SITE_URL}/${person.username}`
  return {
    '@graph': [
      {
        '@type': 'ProfilePage',
        url,
        name: `${head.title} · Angularians`,
        description: head.description,
        isPartOf: SITE_SCHEMA,
        mainEntity: {
          '@type': 'Person',
          name: person.name || person.username,
          alternateName: person.username,
          identifier: String(person.githubId),
          url,
          image: avatarUrl(person.githubId, 320),
          sameAs: [`https://github.com/${person.username}`],
        },
      },
      breadcrumbs([{ name: 'Angularians', path: '/' }, { name: person.name || person.username, path: `/${person.username}` }]),
    ],
  }
}
