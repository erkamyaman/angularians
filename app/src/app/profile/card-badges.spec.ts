import { badgeKey, cardBadgeLabel, hiddenBadgeKeys, shownBadges, badgeNames } from './card-badges'

describe('badgeKey', () => {
  it('makes a label safe for a URL, keeping its letters', () => {
    expect(badgeKey('NG Baguette organizer')).toBe('ng-baguette-organizer')
    expect(badgeKey('#1 in 2018, 2020')).toBe('1-in-2018-2020')
    expect(badgeKey('Русский translator')).toBe('русский-translator')
    expect(badgeKey('Français translator')).toBe('français-translator')
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
    expect(badgeNames('official')).toBe('official')
    expect(badgeNames('none')).toBe('none')
    expect(badgeNames('x')).toBe('fun')
    expect(badgeNames(undefined)).toBe('fun')
  })

  it('uses the official label when asked and there is one', () => {
    const fun = { label: 'Analog alchemist', officialLabel: 'AnalogJS creator' }
    expect(cardBadgeLabel(fun, 'fun')).toBe('Analog alchemist')
    expect(cardBadgeLabel(fun, 'official')).toBe('AnalogJS creator')
    expect(cardBadgeLabel({ label: 'NG Poland organizer' }, 'official')).toBe('NG Poland organizer')
  })
})
