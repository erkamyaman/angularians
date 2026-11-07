import { contributionGrid } from './contribution-grid';

const days = new Map([['2026-03-03', 2], ['2026-03-04', 8], ['2025-12-31', 5]]);

describe('contributionGrid', () => {
  describe('for a past year', () => {
    const grid = contributionGrid(days, '2026', new Date('2027-01-15T05:00:00Z'));

    it('lays out the year in weeks from Sunday, with blanks before 1 January and after 31 December', () => {
      expect(grid.weeks).toHaveLength(53);
      expect(grid.weeks[0]!.slice(0, 4)).toEqual([null, null, null, null]);
      expect(grid.weeks[0]![4]).toMatchObject({ day: '2026-01-01', count: 0, level: 0 });
      expect(grid.weeks[52]![4]).toMatchObject({ day: '2026-12-31' });
      expect(grid.weeks[52]![5]).toBeNull();
    });

    it('shades each day from 1 to 4 against the busiest day, and says what it holds', () => {
      expect(grid.weeks[9]![2]).toEqual({ day: '2026-03-03', count: 2, level: 1, label: '2 contributions on 3 March 2026' });
      expect(grid.weeks[9]![3]).toMatchObject({ count: 8, level: 4 });
      expect(grid.weeks[0]![4]!.label).toBe('No contributions on 1 January 2026');
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

  it('leaves out a month label that would only have its last week to stand over', () => {
    const grid = contributionGrid(days, '12m', new Date('2026-11-03T05:13:00Z'));
    expect(grid.months.at(-1)).toEqual({ label: 'Oct', week: 47 });
  });

  it('draws the whole current year, the days still to come set apart', () => {
    const grid = contributionGrid(days, '2026', new Date('2026-11-07T05:13:00Z'));
    expect(grid.weeks).toHaveLength(53);
    expect(grid.weeks.flat().find(cell => cell?.day === '2026-11-07')).toMatchObject({ day: '2026-11-07' });
    expect(grid.weeks.flat().find(cell => cell?.day === '2026-11-07')!.outside).toBeUndefined();
    expect(grid.weeks.flat().find(cell => cell?.day === '2026-11-08')).toEqual({ day: '2026-11-08', count: 0, level: 0, label: '8 November 2026, still to come', outside: true });
    expect(grid.weeks[52]![4]).toMatchObject({ day: '2026-12-31', outside: true });
  });

  it('draws the last 12 months for 30 days, with only those 30 days counted and the rest set apart', () => {
    const grid = contributionGrid(new Map([['2026-10-07', 9], ['2026-10-08', 2], ['2026-11-07', 1]]), '30d', new Date('2026-11-07T05:13:00Z'));
    expect(grid.weeks[0]![5]).toMatchObject({ day: '2025-11-07' });
    const outside = grid.weeks.flat().find(cell => cell?.day === '2026-10-07')!;
    expect(outside).toEqual({ day: '2026-10-07', count: 0, level: 0, label: '7 October 2026, before the last 30 days', outside: true });
    expect(grid.weeks.flat().find(cell => cell?.day === '2026-10-08')).toMatchObject({ count: 2, level: 4 });
    expect(grid.weeks.flat().filter(cell => cell && !cell.outside)).toHaveLength(31);
    expect(grid.total).toBe(3);
  });

  it('shows the days the 12-month stats count, from the day 365 days before the collection, for the last 12 months and all time', () => {
    const grid = contributionGrid(new Map([['2025-11-06', 9], ['2025-11-07', 3], ['2026-11-07', 1]]), 'all', new Date('2026-11-07T05:13:00Z'));
    expect(grid.weeks[0]![5]).toMatchObject({ day: '2025-11-07', count: 3, level: 4 });
    expect(grid.weeks.at(-1)![6]).toMatchObject({ day: '2026-11-07', count: 1, level: 2 });
    expect(grid.total).toBe(4);
  });

  it('is empty, with no busiest day, for someone with no days in the range', () => {
    const grid = contributionGrid(new Map(), '2015', new Date('2026-11-07T05:13:00Z'));
    expect(grid.total).toBe(0);
    expect(grid.busiest).toBeNull();
  });
});
