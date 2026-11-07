import type { Period } from '@angularians/shared';

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface ContributionDay {
  day: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ContributionGrid {
  weeks: Array<Array<ContributionDay | null>>;
  months: Array<{ label: string, week: number }>;
  total: number;
  activeDays: number;
  busiest: { day: string, count: number } | null;
}

export function contributionGrid(days: ReadonlyMap<string, number>, period: Period, today: Date): ContributionGrid {
  const [start, end] = range(period, today);
  const inRange: Array<[number, number]> = [];
  for (let time = start; time <= end; time += DAY_MS) inRange.push([time, days.get(isoDay(time)) ?? 0]);
  const max = Math.max(0, ...inRange.map(([, count]) => count));

  const weeks: ContributionGrid['weeks'] = [];
  const months: ContributionGrid['months'] = [];
  let week: Array<ContributionDay | null> = Array.from({ length: new Date(start).getUTCDay() }, () => null);
  let busiest: ContributionGrid['busiest'] = null;
  let total = 0;
  let activeDays = 0;
  for (const [time, count] of inRange) {
    const date = new Date(time);
    if (date.getUTCDate() === 1 || time === start) {
      const at = weeks.length;
      if (!months.length || at - months.at(-1)!.week >= 2) months.push({ label: MONTHS[date.getUTCMonth()]!, week: at });
    }
    week.push({ day: isoDay(time), count, level: level(count, max) });
    if (count) {
      total += count;
      activeDays += 1;
      if (!busiest || count > busiest.count) busiest = { day: isoDay(time), count };
    }
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) weeks.push([...week, ...Array.from({ length: 7 - week.length }, () => null)]);
  return { weeks, months, total, activeDays, busiest };
}

function range(period: Period, today: Date): [number, number] {
  if (/^\d{4}$/.test(period)) return [Date.UTC(Number(period), 0, 1), Date.UTC(Number(period), 11, 31)];
  const end = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return [end - 364 * DAY_MS, end];
}

function level(count: number, max: number): ContributionDay['level'] {
  if (!count || !max) return 0;
  return Math.min(4, Math.max(1, Math.ceil((count / max) * 4))) as ContributionDay['level'];
}

const isoDay = (time: number) => new Date(time).toISOString().slice(0, 10);
