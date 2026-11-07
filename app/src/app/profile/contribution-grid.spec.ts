import { contributionGrid } from './contribution-grid';

const today = new Date('2026-11-07T15:00:00Z');

describe('contributionGrid', () => {
  describe('for a year', () => {
    const days = new Map([['2026-03-03', 2], ['2026-03-04', 8], ['2025-12-31', 5]]);
    const grid = contributionGrid(days, '2026', today);

    it('lays out the year in weeks from Sunday, with blanks before 1 January', () => {
      expect(grid.weeks).toHaveLength(53);
      expect(grid.weeks[0]!.slice(0, 4)).toEqual([null, null, null, null]);
      expect(grid.weeks[0]![4]).toEqual({ day: '2026-01-01', count: 0, level: 0 });
      expect(grid.weeks[52]![4]).toEqual({ day: '2026-12-31', count: 0, level: 0 });
      expect(grid.weeks[52]![5]).toBeNull();
    });

    it('shades each day from 1 to 4 against the busiest day of the range', () => {
      expect(grid.weeks[9]![2]).toEqual({ day: '2026-03-03', count: 2, level: 1 });
      expect(grid.weeks[9]![3]).toEqual({ day: '2026-03-04', count: 8, level: 4 });
    });

    it('sums only the days of the range', () => {
      expect(grid.total).toBe(10);
      expect(grid.activeDays).toBe(2);
      expect(grid.busiest).toEqual({ day: '2026-03-04', count: 8 });
    });

    it('labels each month over the week that holds its first day', () => {
      expect(grid.months.slice(0, 3)).toEqual([{ label: 'Jan', week: 0 }, { label: 'Feb', week: 5 }, { label: 'Mar', week: 9 }]);
    });
  });

  describe('for the last 12 months', () => {
    const grid = contributionGrid(new Map([['2025-11-07', 3], ['2025-11-08', 1], ['2026-11-07', 1]]), '12m', today);

    it('ends today and starts 364 days before', () => {
      expect(grid.weeks[0]![6]).toEqual({ day: '2025-11-08', count: 1, level: 4 });
      expect(grid.weeks.at(-1)![6]).toEqual({ day: '2026-11-07', count: 1, level: 4 });
      expect(grid.total).toBe(2);
    });
  });

  it('is empty, with no busiest day, for someone with no days in the range', () => {
    const grid = contributionGrid(new Map(), '2015', today);
    expect(grid.total).toBe(0);
    expect(grid.busiest).toBeNull();
    expect(grid.weeks.flat().every(cell => cell === null || cell.level === 0)).toBe(true);
  });
});
