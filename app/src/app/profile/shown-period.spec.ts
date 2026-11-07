import { missingPeriod, shownPeriod } from './shown-period';

describe('period choice', () => {
  const available = ['all', '2025', '2024'] as const;

  it('shows the asked-for period when the contributor is in it', () => {
    expect(shownPeriod('2025', available)).toBe('2025');
    expect(missingPeriod('2025', available)).toBeNull();
  });

  it('falls back to all time, and names the missing period', () => {
    expect(shownPeriod('12m', available)).toBe('all');
    expect(missingPeriod('12m', available)).toBe('12m');
    expect(missingPeriod('2019', available)).toBe('2019');
  });

  it('has nothing missing without a period, or for all time', () => {
    expect(missingPeriod(null, available)).toBeNull();
    expect(missingPeriod('all', available)).toBeNull();
  });
});
