import { defineEventHandler, setResponseHeader } from 'h3'
import { cacheJson } from '../data/http'
import { contributorsData } from '../data/store'
import { SITE_URL } from '../../app/site'

/** A sitemap file holds 50,000 URLs: the home page and the countries' boards come first. */
const MAX_URLS = 50_000

/**
 * `GET /sitemap.xml`: the pages search engines should know about. The home page, each country's board and the
 * profile of everyone with a merged pull request; the other profiles are reached through the board's links.
 * The data changes once a night, so every URL is dated with the last collection.
 */
export default defineEventHandler((event) => {
  const data = contributorsData()
  const lastmod = data.collectedAt ? `<lastmod>${data.collectedAt.slice(0, 10)}</lastmod>` : ''
  const { usernames, countries } = data.sitemap(MAX_URLS - 1 - 300)
  const paths = ['/', ...countries.map(code => `/?country=${code}`), ...usernames.map(name => `/${name}`)]
  const urls = paths.map(path => `<url><loc>${escapeXml(SITE_URL + path)}</loc>${lastmod}</url>`)
  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
  cacheJson(event)
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
})

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
