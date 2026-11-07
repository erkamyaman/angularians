import { DAY_MS, isYear, periodDays, utcDay, type Period } from '@angularians/shared';
import { formatDay } from '../text/date-format';
import { plural } from '../text/plural';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface ContributionDay {
  day: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  label: string;
  outside?: true;
}

export interface ContributionGrid {
  weeks: Array<Array<ContributionDay | null>>;
  months: Array<{ label: string, week: number }>;
  total: number;
  activeDays: number;
  busiest: { day: string, count: number } | null;
}

export function contributionGrid(days: ReadonlyMap<string, number>, period: Period, collectedAt: Date): ContributionGrid {
  const [first, last] = periodDays(isYear(period) ? period : '12m', collectedAt);
  const counted = Date.parse((period === '30d' ? periodDays('30d', collectedAt) : [first])[0]!);
  const until = Date.parse(last);
  const start = Date.parse(first);
  const end = isYear(period) ? Date.UTC(Number(period), 11, 31) : until;
  const inRange: Array<[number, number]> = [];
  for (let time = start; time <= end; time += DAY_MS) inRange.push([time, time >= counted && time <= until ? days.get(utcDay(time)) ?? 0 : 0]);
  const max = Math.max(0, ...inRange.map(([, count]) => count));

  const weeks: ContributionGrid['weeks'] = [];
  const months: ContributionGrid['months'] = [];
  let week: Array<ContributionDay | null> = Array.from({ length: new Date(start).getUTCDay() }, () => null);
  let busiest: ContributionGrid['busiest'] = null;
  let total = 0;
  let activeDays = 0;
  for (const [time, count] of inRange) {
    const date = new Date(time);
    const day = utcDay(time);
    if (date.getUTCDate() === 1 || time === start) {
      const at = weeks.length;
      if (!months.length || at - months.at(-1)!.week >= 2) months.push({ label: MONTHS[date.getUTCMonth()]!, week: at });
    }
    week.push(time < counted || time > until
      ? { day, count: 0, level: 0, label: `${formatDay(day)}, ${time > until ? 'still to come' : 'before the last 30 days'}`, outside: true }
      : { day, count, level: level(count, max), label: `${count ? plural(count, 'contribution', 'contributions') : 'No contributions'} on ${formatDay(day)}` });
    if (count) {
      total += count;
      activeDays += 1;
      if (!busiest || count > busiest.count) busiest = { day, count };
    }
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) weeks.push([...week, ...Array.from({ length: 7 - week.length }, () => null)]);
  return { weeks, months: months.filter(month => month.week < weeks.length - 1), total, activeDays, busiest };
}

function level(count: number, max: number): ContributionDay['level'] {
  if (!count || !max) return 0;
  return Math.min(4, Math.max(1, Math.ceil((count / max) * 4))) as ContributionDay['level'];
}
