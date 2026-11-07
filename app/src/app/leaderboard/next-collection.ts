/** The nightly collection's schedule, in UTC: `cron` in `.github/workflows/collect.yml`. */
const COLLECT_HOUR = 3
const COLLECT_MINUTE = 17
const MINUTE = 60_000

/** Time until the next collection starts: "5h 20m", "20m", "1m". */
export function untilNextCollection(now: Date): string {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), COLLECT_HOUR, COLLECT_MINUTE)
  const target = next > now.getTime() ? next : next + 24 * 60 * MINUTE
  const minutes = Math.ceil((target - now.getTime()) / MINUTE)
  const hours = Math.floor(minutes / 60)
  return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`
}
