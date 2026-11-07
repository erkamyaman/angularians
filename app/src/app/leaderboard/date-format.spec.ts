import { formatDate, formatMonth } from './date-format';

describe('date format', () => {
  it('formats dates the same on server and browser', () => {
    expect(formatDate('2026-11-03T23:59:00Z')).toBe('Nov 3, 2026');
    expect(formatMonth('2025-04-30T23:59:00Z')).toBe('Apr 2025');
  });
});
