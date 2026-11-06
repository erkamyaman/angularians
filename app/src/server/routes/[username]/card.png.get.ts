import { sendPng } from '../../data/http'
import { createError, defineEventHandler, getQuery, getRouterParam } from 'h3'
import * as v from 'valibot'
import { countryCode, countryName } from '@angularians/shared'
import { avatarData, cardFonts, flagData } from '../../card/assets'
import { cardBadgeImages } from '../../card/badges'
import { cardPeriod, cardTree, renderCard } from '../../card/card'
import { UsernameSchema } from '../../data/schemas'
import { contributorsData } from '../../data/store'

/**
 * `GET /:username/card.png?period=2025&flag=TR`: the Angularian card, for GitHub profile READMEs and the profile's link
 * preview. The URL never changes; the numbers do, every night.
 */
export default defineEventHandler(async (event) => {
  const username = v.safeParse(UsernameSchema, getRouterParam(event, 'username', { decode: true }))
  if (!username.success) throw createError({ statusCode: 400, statusMessage: 'Not a GitHub username' })
  const profile = contributorsData().profile(username.output)
  if (!profile) throw createError({ statusCode: 404, statusMessage: 'No contributions for this username' })

  const period = cardPeriod(profile, getQuery(event)['period'])
  // `?flag=TR`: the country the owner picked for this card. Otherwise their GitHub location.
  const code = countryCode(getQuery(event)['flag']) ?? profile.country ?? null
  const [avatar, flagSrc, fonts, badges] = await Promise.all([avatarData(profile.githubId), code ? flagData(code) : null, cardFonts(), cardBadgeImages(profile)])
  const png = await renderCard(cardTree(profile, period, avatar, code && flagSrc ? { src: flagSrc, name: countryName(code) } : null, badges), fonts)
  // A day in shared caches (GitHub's image proxy too): each night's deploy clears the CDN.
  return sendPng(event, png)
})
