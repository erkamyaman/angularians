import { countrySearchNames } from '@angularians/shared'

/** Whether a search matches a name, ignoring case and accents. */
export function matchesName(name: string, search: string): boolean {
  const plain = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase().replace(/ı/g, 'i')
  return plain(name).includes(plain(search))
}

/** Whether a search matches a country's English name, or another name people know it by. */
export function matchesCountry(code: string, search: string): boolean {
  return countrySearchNames(code).some(name => matchesName(name, search))
}
