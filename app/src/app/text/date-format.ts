const date = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' })
const month = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })

/** UTC, so the server and the browser print the same day (no hydration mismatch). */
export const formatDate = (iso: string): string => date.format(new Date(iso))
/** `Apr 2025`: "Angular contributor since …" on the profile, the signed-in card and the Angularian card. */
export const formatMonth = (iso: string): string => month.format(new Date(iso))

const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const dayInYear = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' })
export const formatDay = (iso: string): string => day.format(new Date(iso))
export const formatDayInYear = (iso: string): string => dayInYear.format(new Date(iso))
