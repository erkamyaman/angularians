import { sendPng } from '../data/http'
import { defineEventHandler, getQuery } from 'h3'
import { periodOrNull, periodPhrase } from '@angularians/shared'
import { avatarData, cardFonts } from '../card/assets'
import { homeTree, renderCard } from '../card/card'
import { contributorsData } from '../data/store'
import { boardDescription } from '../../app/leaderboard/board-description'
import { formatNumber } from '../../app/text/number-format'

/**
 * `GET /og.png?period=2025`: the home page's link preview. Without a period: the people of all time; with one, as a
 * shared `?period=` link of the board shows it: the top Angularians of that period.
 */
export default defineEventHandler(async (event) => {
  const data = contributorsData()
  const requested = getQuery(event)['period']
  const asked = periodOrNull(requested)
  const period = asked && data.hasPeriod(asked) ? asked : null
  const board = data.leaderboard({ period: period ?? 'all', pageSize: 8 })
  const title = period ? `Top Angularians ${periodPhrase(period)}` : 'Meet the Angularians'
  const description = period
    ? boardDescription(board, period)
    : `Every Angular contributor since 2014, ranked: the ${formatNumber(board.total)} people behind Angular, its CLI and its components.`
  const avatars = await Promise.all(board.items.slice(0, 8).map(item => avatarData(item.githubId, 176)))
  const png = await renderCard(homeTree({ title, description, avatars }), await cardFonts())
  return sendPng(event, png)
})
