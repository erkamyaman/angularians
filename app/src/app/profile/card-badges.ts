const MAX_KEYS = 30
const MAX_KEY_LENGTH = 60

export const badgeKey = (label: string): string =>
  label.startsWith('#1 in ') ? 'number-one' : label.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '')

export function hiddenBadgeKeys(value: unknown): string[] {
  if (typeof value !== 'string') return []
  const keys = value.split(',').filter(key => key && key.length <= MAX_KEY_LENGTH)
  return [...new Set(keys)].sort().slice(0, MAX_KEYS)
}

export function shownBadges<T extends { label: string }>(badges: readonly T[], hidden: readonly string[]): T[] {
  return badges.filter(badge => !hidden.includes(badgeKey(badge.label)))
}

export type BadgeNameStyle = 'fun' | 'official' | 'none'

export const parseBadgeNames = (value: unknown): BadgeNameStyle => (value === 'official' || value === 'none' ? value : 'fun')

export const cardBadgeLabel = (badge: { label: string, officialLabel?: string }, names: BadgeNameStyle): string =>
  (names === 'official' && badge.officialLabel) || badge.label

export interface BadgeOptions {
  hidden: readonly string[]
  names: BadgeNameStyle
}

export const parseBadgeOptions = (hide: unknown, names: unknown): BadgeOptions => ({ hidden: hiddenBadgeKeys(hide), names: parseBadgeNames(names) })

export function badgeQuery({ hidden, names }: BadgeOptions): Record<string, string> {
  return {
    ...(hidden.length ? { hide: [...hidden].sort().join(',') } : {}),
    ...(names !== 'fun' ? { names } : {}),
  }
}
