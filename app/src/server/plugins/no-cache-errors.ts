import { defineNitroPlugin } from 'nitropack/runtime'
import type { H3Event } from 'h3'

const uncached = (event: H3Event | undefined) => {
  const response = event?.node.res
  if (!response || response.headersSent || response.statusCode < 500) return
  response.setHeader('cache-control', 'no-store')
  response.setHeader('netlify-cdn-cache-control', 'no-store')
}

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('error', (_error, { event }) => uncached(event))
  nitro.hooks.hook('beforeResponse', event => uncached(event))
})
