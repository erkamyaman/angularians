import { formatPoints, formatRank, plural, pluralWord } from './number-format';

describe('number format', () => {
  it('formats points and plurals the same on server and browser', () => {
    expect(formatPoints(1)).toBe('1 pt');
    expect(formatPoints(5539)).toBe('5,539 pts');
    expect(plural(1, 'person', 'people')).toBe('1 person');
    expect(plural(2194, 'person', 'people')).toBe('2,194 people');
    expect(pluralWord(1, 'Issue', 'Issues')).toBe('Issue');
    expect(pluralWord(0, 'Issue', 'Issues')).toBe('Issues');
    expect(formatRank(12345)).toBe('#12,345');
  });
});
