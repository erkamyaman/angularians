import { cacheFor } from '../data/http'
import { defineEventHandler, getQuery, setResponseHeader } from 'h3'
import { isPeriod, periodPhrase } from '@angularians/shared'
import { avatarData, cardFonts } from '../card/assets'
import { homeTree, renderCard } from '../card/card'
import { contributorsData } from '../data/store'

const format = new Intl.NumberFormat('en-US').format

/**
 * `GET /og.png?period=2025`: the home page's link preview. Without a period: the people of all time; with one, as a
 * shared `?period=` link of the board shows it: the top Angularians of that period.
 */
export default defineEventHandler(async (event) => {
  const data = contributorsData()
  const requested = getQuery(event)['period']
  const period = typeof requested === 'string' && isPeriod(requested) && data.hasPeriod(requested) ? requested : null
  const board = data.leaderboard({ period: period ?? 'all', pageSize: 8 })
  const title = period ? `Top Angularians ${periodPhrase(period)}` : 'Meet the Angularians'
  const description = period
    ? `${format(board.total)} people contributed to Angular ${periodPhrase(period)}: ${format(board.landedPullRequests)} merged pull requests, ${format(board.issues)} issues and ${format(board.comments + board.reviewComments)} comments.`
    : `The ${format(board.total)} people behind Angular, its CLI and its components, ranked by their contributions since 2014.`
  const avatars = await Promise.all(board.items.slice(0, 8).map(item => avatarData(item.githubId, 176)))
  const png = await renderCard(homeTree({ title, description, avatars }), await cardFonts())
  setResponseHeader(event, 'content-type', 'image/png')
  cacheFor(event, { browser: 3600, shared: 86400, stale: 604800 })
  return png
})
