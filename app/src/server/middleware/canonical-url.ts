import { defineEventHandler, getRequestHeader, sendRedirect } from 'h3'
import { canonicalRedirect } from '../data/canonical-url'

/** One address per page: see `canonicalRedirect`. A permanent redirect, which search engines follow and merge. */
export default defineEventHandler((event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return undefined
  const target = canonicalRedirect(getRequestHeader(event, 'host'), event.path)
  return target ? sendRedirect(event, target, 301) : undefined
})
