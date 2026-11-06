// Ported from nuxt/nuxters `scripts/utils/countries.ts` (MIT, Copyright (c) 2023 Nuxt).
// The download of the GeoNames dumps stays in the collector: this file only parses and matches.

/**
 * The country of a free-form GitHub location ("Lyon, France", "Paris", "Austin, TX"),
 * as an ISO 3166-1 alpha-2 code. Names come from GeoNames (CC BY 4.0): countries, and cities of 15,000+ people
 * (`countryInfo.txt` and `cities15000.txt`).
 */
export type CountryIndex = {
  /** Normalized country name or ISO3 code → ISO2 code */
  countries: Map<string, string>
  /** Normalized city name → ISO2 code of the most populated city of that name */
  cities: Map<string, { country: string, population: number }>
  /** Normalized city name and letter region code ("paris|tx") → ISO2 code */
  regions: Map<string, string>
}

const COUNTRY_ALIASES: Record<string, string> = {
  'uk': 'GB', 'england': 'GB', 'scotland': 'GB', 'wales': 'GB', 'great britain': 'GB', 'northern ireland': 'GB',
  'us': 'US', 'u s': 'US', 'u s a': 'US', 'united states of america': 'US',
  'holland': 'NL', 'uae': 'AE', 'prc': 'CN', 'korea': 'KR', 'czech republic': 'CZ', 'russian federation': 'RU',
}

/** Places that are not a city of that name: regions people write as their location. */
const PLACE_ALIASES: Record<string, string> = { 'bay area': 'US', 'sf bay area': 'US', 'silicon valley': 'US' }
/** Continents and the like name no country: never a town of that name ("Asia" is one in the Philippines). */
const NOWHERE = new Set(['asia', 'europe', 'africa', 'america', 'north america', 'south america', 'latin america', 'oceania', 'earth', 'planet earth', 'world', 'worldwide', 'remote', 'internet', 'home'])

/**
 * US states and Canadian provinces by name and code: a location ending with one is in that country ("Austin, Texas",
 * "Victoria, BC"), before a country of the same name ("Atlanta, Georgia"). GeoNames gives Canadian cities numeric
 * province codes ("02"): mapped to the letters people write.
 */
const US_STATES: Record<string, string> = {
  alabama: 'al', alaska: 'ak', arizona: 'az', arkansas: 'ar', california: 'ca', colorado: 'co', connecticut: 'ct',
  delaware: 'de', florida: 'fl', georgia: 'ga', hawaii: 'hi', idaho: 'id', illinois: 'il', indiana: 'in', iowa: 'ia',
  kansas: 'ks', kentucky: 'ky', louisiana: 'la', maine: 'me', maryland: 'md', massachusetts: 'ma', michigan: 'mi',
  minnesota: 'mn', mississippi: 'ms', missouri: 'mo', montana: 'mt', nebraska: 'ne', nevada: 'nv',
  'new hampshire': 'nh', 'new jersey': 'nj', 'new mexico': 'nm', 'new york': 'ny', 'north carolina': 'nc',
  'north dakota': 'nd', ohio: 'oh', oklahoma: 'ok', oregon: 'or', pennsylvania: 'pa', 'rhode island': 'ri',
  'south carolina': 'sc', 'south dakota': 'sd', tennessee: 'tn', texas: 'tx', utah: 'ut', vermont: 'vt',
  virginia: 'va', washington: 'wa', 'west virginia': 'wv', wisconsin: 'wi', wyoming: 'wy', 'district of columbia': 'dc',
}
const CA_PROVINCES: Record<string, { code: string, name: string }> = {
  '01': { code: 'ab', name: 'alberta' }, '02': { code: 'bc', name: 'british columbia' }, '03': { code: 'mb', name: 'manitoba' },
  '04': { code: 'nb', name: 'new brunswick' }, '05': { code: 'nl', name: 'newfoundland and labrador' },
  '07': { code: 'ns', name: 'nova scotia' }, '08': { code: 'on', name: 'ontario' }, '09': { code: 'pe', name: 'prince edward island' },
  '10': { code: 'qc', name: 'quebec' }, '11': { code: 'sk', name: 'saskatchewan' }, '12': { code: 'yt', name: 'yukon' },
  '13': { code: 'nt', name: 'northwest territories' }, '14': { code: 'nu', name: 'nunavut' },
}
/** A region written in full, as its code: "georgia" → "ga". */
const REGION_NAMES = new Map<string, string>([
  ...Object.entries(US_STATES),
  ...Object.values(CA_PROVINCES).map(({ code, name }) => [name, code] as [string, string]),
])
/** A location that is only a region, or ends with one without a city we know: its country. */
const REGION_COUNTRY = new Map<string, string>([
  ...Object.keys(US_STATES).filter(name => name !== 'georgia' && name !== 'washington' && name !== 'new york').map(name => [name, 'US'] as [string, string]),
  ...Object.values(CA_PROVINCES).map(({ name }) => [name, 'CA'] as [string, string]),
])
/** Still listed by GeoNames, dissolved: Netherlands Antilles, Serbia and Montenegro. */
const DISSOLVED = new Set(['AN', 'CS'])
/** Country names in these languages too ("Deutschland", "España"): GeoNames only has the English ones. */
/** English first ("Netherlands" for GeoNames' "The Netherlands"), then other scripts too ("日本", "Россия"). */
const LOCALES = ['en', 'de', 'es', 'fr', 'it', 'pt', 'nl', 'pl', 'sv', 'da', 'nb', 'fi', 'cs', 'tr', 'ro', 'hu', 'id', 'vi', 'ru', 'uk', 'ja', 'zh', 'ko']

/** Lowercase letters and digits of any script, accents removed, words separated by one space. */
const normalize = (value: string) => value
  .normalize('NFKD')
  .replace(/\p{M}/gu, '')
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .trim()

/** A country's name without a leading article: "The Netherlands" → "netherlands". */
const countryKey = (value: string) => normalize(value).replace(/^the /, '')

/** Build the index from GeoNames `countryInfo.txt` and a `cities*.txt` dump. */
export function parseCountryIndex(countryInfo: string, cityDump: string): CountryIndex {
  const countries = new Map(Object.entries(COUNTRY_ALIASES))
  for (const line of countryInfo.split('\n')) {
    const [code, iso3, , , name] = line.split('\t')
    if (line.startsWith('#') || !code || !iso3 || !name || DISSOLVED.has(code)) continue
    countries.set(normalize(iso3), code)
    countries.set(countryKey(name), code)
  }
  for (const code of new Set(countries.values())) {
    for (const locale of LOCALES) {
      const key = countryKey(new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? '')
      // English first: a localized name never replaces another country's English one.
      if (key && !countries.has(key)) countries.set(key, code)
    }
  }

  const cities: CountryIndex['cities'] = new Map()
  const regions: CountryIndex['regions'] = new Map()
  for (const line of cityDump.split('\n')) {
    const fields = line.split('\t')
    const [, name, asciiName, alternateNames] = fields
    const country = fields[8]
    // US states and a few other countries: "TX", "CA". Canada's are numeric ("02"), mapped to letters ("bc");
    // other numeric codes are not what people write.
    const admin = fields[10] ?? ''
    const region = /^[A-Z]{2}$/.test(admin) ? admin.toLowerCase() : country === 'CA' ? CA_PROVINCES[admin]?.code ?? null : null
    const population = Number(fields[14] || 0)
    if (!name || !country) continue
    for (const candidate of [name, asciiName, ...(alternateNames?.split(',') ?? [])]) {
      const key = normalize(candidate ?? '')
      // Two-letter names are codes ("CA" is Canada and California), not cities.
      if (key.length > 2 && population > (cities.get(key)?.population ?? -1)) {
        cities.set(key, { country, population })
      }
      if (key.length > 2 && region) regions.set(`${key}|${region}`, country)
    }
  }
  return { countries, cities, regions }
}

/**
 * A city and its region code ("Paris, TX") is in that region's country. A location ending with a country
 * ("Lyon, France") is in that country. Otherwise the city decides, the most populated one of that name.
 * Two-letter codes alone match nothing: "CA" is Canada and California.
 */
export function countryFromLocation(location: string | null | undefined, index: CountryIndex): string | null {
  const parts = (location ?? '').split(/[,/|·•()]|\s+-\s+/).map(normalize).filter(part => part && !NOWHERE.has(part))
  const last = parts.at(-1) ?? ''
  // "Austin, TX" and "Atlanta, Georgia": a city in that region, before a country named like the region.
  const regionCode = REGION_NAMES.get(last) ?? last
  const region = parts.length > 1 ? index.regions.get(`${parts[0]}|${regionCode}`) : undefined
  if (region) return region
  const country = index.countries.get(last.replace(/^the /, ''))
  if (country) return country
  const place = PLACE_ALIASES[last] ?? REGION_COUNTRY.get(last)
  if (place) return place
  for (const part of parts) {
    const city = index.cities.get(part)
    if (city) return city.country
    const alias = PLACE_ALIASES[part]
    if (alias) return alias
  }
  return null
}
