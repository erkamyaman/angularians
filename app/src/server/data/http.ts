import { createError, getQuery, setResponseHeader, type H3Event } from 'h3'
import * as v from 'valibot'

/**
 * The data changes once a night, with a new deploy: browsers keep a response 5 minutes,
 * shared caches an hour, and may serve a stale one for a day while they refresh it.
 */
export function cacheJson(event: H3Event): void {
  cacheFor(event, { browser: 300, shared: 3600, stale: 86400 })
}

export function cacheFor(event: H3Event, seconds: { browser: number, shared: number, stale: number }): void {
  const shared = `s-maxage=${seconds.shared}, stale-while-revalidate=${seconds.stale}`
  setResponseHeader(event, 'cache-control', `public, max-age=${seconds.browser}, ${shared}`)
  setResponseHeader(event, 'netlify-cdn-cache-control', `public, durable, ${shared}`)
}

/** Validate the query string against a schema, or answer 400 with what is wrong. */
export function parseQuery<S extends v.GenericSchema>(event: H3Event, schema: S, coerce: (query: Record<string, unknown>) => Record<string, unknown>): v.InferOutput<S> {
  const result = v.safeParse(schema, coerce(getQuery(event)))
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', data: { issues: v.flatten(result.issues).nested } })
  }
  return result.output
}
