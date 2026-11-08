import { createError, defineEventHandler, getQuery, sendRedirect } from 'h3'
import { afterSignIn, safeReturnTo } from '../../../auth/return-to'
import { authSession, callbackUrl, requireAuthConfig, setSignedInHint } from '../../../auth/session'
import { contributorsData } from '../../../data/store'

/** `GET /api/auth/callback?code&state`: GitHub sends you back here; we ask GitHub who you are, then forget its token. */
export default defineEventHandler(async (event) => {
  const config = requireAuthConfig()
  const session = await authSession(event, config.password)
  const { code, state, error } = getQuery(event)
  const expected = session.data.state
  // "Cancel" on GitHub's page (`?error=access_denied`), or GitHub refusing: back where it started, not an error page.
  if (typeof error === 'string') {
    const returnTo = session.data.returnTo
    await session.update({ state: undefined, returnTo: undefined })
    return sendRedirect(event, safeReturnTo(returnTo), 302)
  }
  // Nothing is written: a mismatch must not cancel a sign-in still going on in another tab.
  if (typeof code !== 'string' || typeof state !== 'string' || !expected || state !== expected) {
    throw createError({ statusCode: 400, statusMessage: 'The sign-in expired or was not started here: try again' })
  }

  const exchange = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'accept': 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ client_id: config.clientId, client_secret: config.clientSecret, code, redirect_uri: callbackUrl(event) }),
  })
  const { access_token: token } = await exchange.json() as { access_token?: string }
  if (!token) throw createError({ statusCode: 502, statusMessage: 'GitHub did not sign you in: try again' })

  const response = await fetch('https://api.github.com/user', {
    headers: { 'accept': 'application/vnd.github+json', 'authorization': `Bearer ${token}`, 'user-agent': 'angularians', 'x-github-api-version': '2022-11-28' },
  })
  const user = await response.json() as { id?: number, login?: string }
  if (!response.ok || typeof user.id !== 'number' || typeof user.login !== 'string') {
    throw createError({ statusCode: 502, statusMessage: 'GitHub did not say who you are: try again' })
  }

  const returnTo = session.data.returnTo
  await session.update({ githubId: user.id, login: user.login, state: undefined, returnTo: undefined })
  setSignedInHint(event, true)
  return sendRedirect(event, afterSignIn(returnTo, contributorUsername(user.id)), 302)
})

function contributorUsername(githubId: number): string | null {
  try {
    return contributorsData().profileById(githubId)?.username ?? null
  } catch {
    return null
  }
}
