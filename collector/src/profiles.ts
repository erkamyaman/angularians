// Ported from nuxt/nuxters `scripts/collect-contributors.ts` and `scripts/utils/countries.ts`
// (MIT, Copyright (c) 2023 Nuxt).
import { strFromU8, unzipSync } from 'fflate'
import { countryFromLocation, parseCountryIndex, type CountryIndex, type ProfileRecord, type SocialAccount } from '@angularians/shared'
import { graphql } from './github.ts'

const GEONAMES_COUNTRIES_URL = 'https://download.geonames.org/export/dump/countryInfo.txt'
const GEONAMES_CITIES_URL = 'https://download.geonames.org/export/dump/cities15000.zip'

/** GeoNames (CC BY 4.0): countries, and cities of 15,000+ people. */
export async function loadCountryIndex(): Promise<CountryIndex> {
  const [countryInfo, cities] = await Promise.all([fetch(GEONAMES_COUNTRIES_URL), fetch(GEONAMES_CITIES_URL)])
  if (!countryInfo.ok || !cities.ok) throw new Error(`GeoNames download failed: ${countryInfo.status} ${cities.status}`)
  const archive = unzipSync(new Uint8Array(await cities.arrayBuffer()))
  const cityDump = Object.entries(archive).find(([name]) => name.endsWith('.txt'))?.[1]
  if (!cityDump) throw new Error('GeoNames archive has no city file')
  return parseCountryIndex(await countryInfo.text(), strFromU8(cityDump))
}

/** One GraphQL query per 100 users costs 1 point of the 5,000 per hour. */
const BATCH_SIZE = 100
const CONCURRENCY = 3
const FIELDS = 'databaseId login name websiteUrl twitterUsername location socialAccounts(first: 10) { nodes { provider url displayName } }'

export type GraphQLProfile = {
  databaseId: number | null
  login: string
  name: string | null
  websiteUrl: string | null
  twitterUsername: string | null
  location: string | null
  socialAccounts: { nodes: Array<{ provider: string, url: string, displayName: string } | null> | null } | null
} | null

/** GitHub still stores Twitter links as `twitter.com`: link to `x.com`, the current domain. */
const toXUrl = (url: string) => url.replace(/^https?:\/\/(?:www\.|mobile\.)?twitter\.com\//i, 'https://x.com/')

/** Links and country only: the location itself is not kept. `null` for a profile with none of them. */
export function toProfileRecord(githubId: number, user: GraphQLProfile, countries: CountryIndex): ProfileRecord | null {
  // A login freed and taken by another account since the PR: not the same person.
  if (!user || user.databaseId !== githubId) return null
  const socialAccounts: SocialAccount[] = (user.socialAccounts?.nodes ?? []).flatMap((account) => {
    if (!account) return []
    const provider = account.provider.toLowerCase()
    return [{ provider, url: provider === 'twitter' ? toXUrl(account.url) : account.url, displayName: account.displayName }]
  })
  if (user.twitterUsername && !socialAccounts.some(account => account.provider === 'twitter')) {
    socialAccounts.push({ provider: 'twitter', url: `https://x.com/${user.twitterUsername}`, displayName: `@${user.twitterUsername}` })
  }
  const name = user.name?.trim() || null
  // GitHub keeps the website as typed: `example.com` is common.
  const typed = user.websiteUrl?.trim()
  const website = typed ? (/^https?:\/\//i.test(typed) ? typed : `https://${typed}`) : null
  const country = countryFromLocation(user.location, countries)
  if (!name && !website && !socialAccounts.length && !country) return null
  return { githubId, username: user.login, name, website, socialAccounts, country }
}

export async function fetchBatch(batch: Array<{ username: string, githubId: number }>, countries: CountryIndex): Promise<ProfileRecord[]> {
  const variables = Object.fromEntries(batch.map((user, index) => [`l${index}`, user.username]))
  const query = `query(${batch.map((_, index) => `$l${index}: String!`).join(', ')}) {
    ${batch.map((_, index) => `u${index}: user(login: $l${index}) { ${FIELDS} }`).join('\n')}
  }`
  // Rate limits are waited out in `graphql`.
  const { data, errors } = await graphql<Record<string, GraphQLProfile>>(query, variables)
  // A deleted or renamed account resolves to `null` with a NOT_FOUND error: keep the rest of the batch.
  if (!data || errors?.some(error => error.type !== 'NOT_FOUND')) {
    throw new Error(`GraphQL profiles failed: ${JSON.stringify(errors).slice(0, 300)}`)
  }
  return batch.flatMap((user, index) => {
    const record = toProfileRecord(user.githubId, data[`u${index}`] ?? null, countries)
    return record ? [record] : []
  })
}

/** The profiles of every all-time contributor, sorted by GitHub id so a diff only shows the changes. */
export async function collectProfiles(users: Array<{ username: string, githubId: number }>): Promise<ProfileRecord[]> {
  const countries = await loadCountryIndex()
  const batches: Array<typeof users> = []
  for (let index = 0; index < users.length; index += BATCH_SIZE) batches.push(users.slice(index, index + BATCH_SIZE))
  const profiles: ProfileRecord[] = []
  let next = 0
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (next < batches.length) profiles.push(...await fetchBatch(batches[next++]!, countries))
  }))
  return profiles.sort((a, b) => a.githubId - b.githubId)
}
