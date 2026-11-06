import { SITE_URL } from '../../app/site'

/** The site's Netlify subdomain: it serves the same pages, so it sends everyone to the domain. Deploy previews keep theirs. */
const NETLIFY_HOST = 'angularians.netlify.app'

/**
 * Where a request should go instead, so every page has one address for search engines: the domain for the Netlify
 * subdomain, and a path without its trailing slash (`/erkamyaman/` → `/erkamyaman`). `null` when it is fine as it is.
 * `url` is the path with its query string. Leading slashes or backslashes collapse into one: `//evil.com` or `/\evil.com`
 * as a Location would send the browser to another site.
 */
export function canonicalRedirect(host: string | undefined, url: string): string | null {
  const [path = '/', query] = splitQuery(url)
  const single = path.replace(/^[/\\]+/, '/')
  const trimmed = single.length > 1 && single.endsWith('/') ? single.replace(/\/+$/, '') || '/' : single
  const onSubdomain = host?.toLowerCase().split(':')[0] === NETLIFY_HOST
  if (!onSubdomain && trimmed === path) return null
  const target = trimmed + (query === undefined ? '' : `?${query}`)
  return onSubdomain ? SITE_URL + target : target
}

function splitQuery(url: string): [string, string | undefined] {
  const index = url.indexOf('?')
  return index === -1 ? [url, undefined] : [url.slice(0, index), url.slice(index + 1)]
}
