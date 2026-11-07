import { countryName, periodPhrase, type LeaderboardPage, type Period } from '@angularians/shared'
import { boardDescription } from './board-description'
import { formatNumber } from '../text/number-format'
import { SITE_DESCRIPTION, SITE_TITLE } from '../site'

/**
 * The home page's title and description. A shared `?period=` link gets its own, and so does a country's board (its own
 * page for search engines too); the plain page keeps the generic ones. `shared` and `country` are only set for a
 * board with people on it.
 */
export function boardHead(page: LeaderboardPage | undefined, shared: Period | null, country: string | null): { title: string, description: string } {
  const where = country ? ` in ${countryName(country)}` : ''
  if (shared && page) return { title: `Top Angularians${where} ${periodPhrase(shared)}`, description: boardDescription(page, shared) }
  if (country && page) {
    return {
      title: `Top Angularians in ${countryName(country)} · Angular contributors`,
      description: `The ${formatNumber(page.total)} people from ${countryName(country)} who have contributed to Angular since 2014, ranked: merged pull requests, issues, comments and code reviews.`,
    }
  }
  return { title: SITE_TITLE, description: SITE_DESCRIPTION }
}
