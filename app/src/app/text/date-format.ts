const date = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' })
const month = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })

/** UTC, so the server and the browser print the same day (no hydration mismatch). */
export const formatDate = (iso: string): string => date.format(new Date(iso))
/** `Apr 2025`: "Angular contributor since …" on the profile, the signed-in card and the Angularian card. */
export const formatMonth = (iso: string): string => month.format(new Date(iso))
