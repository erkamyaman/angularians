import { formatPoints, formatRank } from './number-format';

describe('number format', () => {
  it('formats points and ranks the same on server and browser', () => {
    expect(formatPoints(1)).toBe('1 pt');
    expect(formatPoints(5539)).toBe('5,539 pts');
    expect(formatRank(12345)).toBe('#12,345');
  });
});
