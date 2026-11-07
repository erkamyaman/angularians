import { countryName } from '@angularians/shared'
import { breadcrumbs } from '../seo-head'
import { SITE_DESCRIPTION, SITE_SCHEMA } from '../site'

/** The home page's structured data: the site itself, or a country's board as a step below it. */
export function boardJsonLd(country: string | null): object {
  return country
    ? breadcrumbs([{ name: 'Angularians', path: '/' }, { name: `Angular contributors in ${countryName(country)}`, path: `/?country=${country}` }])
    : { ...SITE_SCHEMA, description: SITE_DESCRIPTION }
}
