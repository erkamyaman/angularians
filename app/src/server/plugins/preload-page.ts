import { defineNitroPlugin, useStorage } from 'nitropack/runtime'
import { pageModule, pagePreloads, withPreloads, type ClientManifest } from '../data/page-preloads'

let manifest: Promise<ClientManifest | null> | undefined
const loadManifest = () =>
  (manifest ??= useStorage('assets:client-manifest').getItem<ClientManifest>('manifest.json').catch(() => null))

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('beforeResponse', async (event, response) => {
    if (typeof response.body !== 'string' || !/^\s*<!doctype html/i.test(response.body)) return
    const client = await loadManifest()
    if (client) response.body = withPreloads(response.body, pagePreloads(client, pageModule(event.path)))
  })
})
