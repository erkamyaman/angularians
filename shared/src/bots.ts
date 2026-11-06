// Ported from nuxt/nuxters `scripts/collect-contributors.ts` (MIT, Copyright (c) 2023 Nuxt).

/**
 * Bot accounts without `[bot]` or `-bot` in their login.
 * Add more from the `Possible bots` line a collection run prints.
 */
export const KNOWN_BOT_ACCOUNTS: readonly string[] = [
  'codecov-io',
  'codecov-commenter',
  // Found in the first angular/angular run: dependency and docs updates.
  'angular-robot',
  // Found in the first run with comments: the merge bot and the CLA bot.
  'mary-poppins',
  'googlebot',
  // Found comparing with nuxt/nuxters: Google's code sync, the build artifacts pusher and a CI token.
  'copybara-service',
  'angular-builds',
  'angular-github-ratelimit-token',
]

/** The known list, lowercased once: an entry written with capitals still matches. */
const KNOWN = new Set(KNOWN_BOT_ACCOUNTS.map(login => login.toLowerCase()))

/**
 * GitHub apps (`renovate[bot]`), `-bot` accounts, the `ghost` of deleted accounts, and the known list.
 * `type`: the account type GitHub sends with a user (`User`, `Bot`, `Organization`), when there is one.
 */
export function isBotAccount(login: string | null | undefined, type?: string | null): boolean {
  if (!login || type === 'Bot') return true
  const lower = login.toLowerCase()
  return KNOWN.has(lower) || lower.includes('[bot]') || lower.endsWith('-bot') || lower === 'ghost'
}
