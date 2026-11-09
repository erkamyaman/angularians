import { badgeKey, badgeQuery, cardBadgeLabel, hiddenBadgeKeys, parseBadgeNames, parseBadgeOptions, shownBadges } from './card-badges'

describe('badgeKey', () => {
  it('makes a label safe for a URL, keeping its letters', () => {
    expect(badgeKey('NG Baguette organizer')).toBe('ng-baguette-organizer')
    expect(badgeKey('Top 10 all time')).toBe('top-10-all-time')
    expect(badgeKey('Русский translator')).toBe('русский-translator')
    expect(badgeKey('Français translator')).toBe('français-translator')
  })

  it('keeps one key for the #1 badge as its years grow', () => {
    expect(badgeKey('#1 in 2024')).toBe(badgeKey('#1 in 2024–2025'))
  })
})

describe('hiddenBadgeKeys', () => {
  it('reads a comma list, sorted and without repeats', () => {
    expect(hiddenBadgeKeys('reviewer,creator,reviewer')).toEqual(['creator', 'reviewer'])
  })

  it('ignores anything that is not a usable list', () => {
    expect(hiddenBadgeKeys(undefined)).toEqual([])
    expect(hiddenBadgeKeys('')).toEqual([])
    expect(hiddenBadgeKeys(['a', 'b'])).toEqual([])
    expect(hiddenBadgeKeys(`${'x'.repeat(61)},ok`)).toEqual(['ok'])
  })

  it('reads at most 30 keys', () => {
    expect(hiddenBadgeKeys(Array.from({ length: 40 }, (_, index) => `k${index}`).join(',')).length).toBe(30)
  })
})

describe('shownBadges', () => {
  const badges = [{ label: 'Creator' }, { label: 'Reviewer' }]

  it('leaves out the hidden ones and keeps the order', () => {
    expect(shownBadges(badges, ['creator'])).toEqual([{ label: 'Reviewer' }])
    expect(shownBadges(badges, [])).toEqual(badges)
  })
})

describe('badge names', () => {
  it('reads official and none, and anything else is fun', () => {
    expect(parseBadgeNames('official')).toBe('official')
    expect(parseBadgeNames('none')).toBe('none')
    expect(parseBadgeNames('x')).toBe('fun')
    expect(parseBadgeNames(undefined)).toBe('fun')
  })

  it('uses the official label when asked and there is one', () => {
    const fun = { label: 'Analog alchemist', officialLabel: 'AnalogJS creator' }
    expect(cardBadgeLabel(fun, 'fun')).toBe('Analog alchemist')
    expect(cardBadgeLabel(fun, 'official')).toBe('AnalogJS creator')
    expect(cardBadgeLabel({ label: 'NG Poland organizer' }, 'official')).toBe('NG Poland organizer')
  })
})

describe('badgeQuery', () => {
  it('leaves out the defaults', () => {
    expect(badgeQuery({ hidden: [], names: 'fun' })).toEqual({})
  })

  it('sorts what is hidden and names the choice', () => {
    expect(badgeQuery({ hidden: ['reviewer', 'creator'], names: 'none' })).toEqual({ hide: 'creator,reviewer', names: 'none' })
  })
})

describe('parseBadgeOptions', () => {
  it('reads both card choices', () => {
    expect(parseBadgeOptions('reviewer', 'none')).toEqual({ hidden: ['reviewer'], names: 'none' })
  })
})
