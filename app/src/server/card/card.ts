// The Angularian card: the profile's link preview (og:image) and the GitHub README card, as one PNG.
// After nuxt.com's `OgImage/Nuxter.takumi.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs): the same layout,
// our colours and mark. Only the username and the period are in its URL: the numbers are read when it renders.
import { Resvg } from '@resvg/resvg-js'
import { periodOrNull, periodPhrase, type ContributorProfile, type Period } from '@angularians/shared'
import satori from 'satori'
import { formatNumber, formatPoints } from '../../app/leaderboard/format'

export const CARD_WIDTH = 1200
export const CARD_HEIGHT = 630
/** Drawn at twice its size: the logos and the text stay sharp on high-density screens and in a download. */
const PIXEL_RATIO = 2

/** The brand colour and the profile's stat colours (GitHub's, in its dark theme). */
const BRAND = '#D29922'
const COLORS = { pullRequests: '#A371F7', issues: '#3FB950', comments: '#58A6FF', reactions: '#D29922' }
/** The mark, in its dark colours: [fill, path] of each part (app/scripts/logo/build.py). */
const MARK: Array<[string, string]> = [
  ['#D29922', 'M10.26 3.2L10.34 3.41L10.44 3.68L11.28 7.69L11.1 8.16L11.41 8.39L12.67 14.71L12.67 15.08L13.33 17.51L13.4 17.96L13.43 17.96L14.21 21.67L15.44 20.98L11.6 2.69L11.55 2.7L10.26 3.16ZM2.34 6.01L2.28 6.06L2.22 6.12L2.18 6.19L2.15 6.27L2.13 6.35L2.14 6.43L3.51 18.32L3.53 18.4L3.56 18.47L3.61 18.54L3.67 18.6L3.73 18.64L4.51 19.07L4.71 17.96L4.69 17.96L4.76 17.64L5.02 15.99L5.31 15.7L5.28 15.18L5.81 11.96L5.88 11.46L6.04 10.91L6.04 10.44L6.83 6.93L7.3 6.37L7.01 5.98L7.19 4.93L7.35 4.21L2.42 5.98ZM11.56 22.98L11.65 23L11.74 23L11.82 22.98L11.9 22.95L12.03 22.88L11 17.96L11.04 17.96L10.94 17.28L11.15 17.02L10.92 16.86L10.71 15.99L10.65 15.78L10.29 15.84L10.26 15.84L9.74 16.2L7.98 16.62L7.75 16.73L7.22 16.94L7.06 17.96L7.09 17.96L6.71 20.3L11.48 22.95ZM9.34 13.87L10.08 13.69L9.55 10.86L9.45 9.49L9.34 9.02L8.95 6.24L8.43 9.44L8.16 9.57L8.3 9.99L7.95 12.53L7.98 12.51L7.67 14.21L7.64 14.39Z'],
  ['#4A525C', 'M12.89 2.92L12.6 2.82L12.76 3.59L12.95 3.05L12.96 3L12.93 2.95ZM14.1 4.71L14.49 3.6L14.5 3.55L14.47 3.5L14.43 3.47L13.33 3.08L13.27 3.07L13.23 3.1L13.19 3.14L12.86 4.07L12.93 4.4L13.96 4.77L14.02 4.77L14.07 4.75ZM16.35 4.18L16.31 4.2L16.27 4.24L15.88 5.35L15.88 5.4L15.9 5.45L15.94 5.48L17.04 5.87L17.1 5.88L17.15 5.85L17.18 5.81L17.57 4.71L17.58 4.65L17.55 4.61L17.51 4.58L16.41 4.18ZM13.54 6.25L13.94 5.14L13.94 5.09L13.92 5.04L13.88 5.01L12.99 4.69L13.32 6.28L13.41 6.31L13.47 6.31L13.51 6.29ZM14.31 8.64L13.78 8.45L14.04 9.7L14.38 8.78L14.38 8.72L14.36 8.68ZM14.75 12.28L14.57 12.21L14.68 12.76L14.81 12.41L14.82 12.36L14.79 12.31ZM15.8 14.5L15.8 14.45L15.78 14.4L15.74 14.37L14.96 14.09L15.29 15.67L15.33 15.67L15.37 15.65L15.4 15.6ZM16.17 18L15.75 17.85L15.97 18.88L16.24 18.13L16.24 18.08L16.22 18.03ZM21.78 4.44L21.72 4.38L21.66 4.33L21.58 4.3L21.58 4.3L21.53 4.29L21.48 4.32L21.45 4.36L21.05 5.46L21.05 5.52L21.07 5.56L21.11 5.59L21.74 5.82L21.86 4.75L21.87 4.67L21.85 4.59L21.82 4.51ZM21 10.77L21.16 10.82L21.3 9.62L20.94 10.63L20.93 10.69L20.95 10.74ZM17.78 9.9L17.73 9.92L17.7 9.97L17.3 11.07L17.3 11.12L17.32 11.17L17.37 11.2L18.47 11.6L18.52 11.6L18.57 11.58L18.6 11.54L19 10.43L19 10.38L18.98 10.33L18.93 10.3L17.83 9.91ZM20.78 11.07L20.38 12.17L20.38 12.23L20.4 12.28L20.45 12.31L20.97 12.49L21.13 11.09L20.91 11.01L20.86 11.01L20.81 11.03ZM16.67 12.98L16.63 13L16.59 13.05L16.2 14.15L16.2 14.2L16.22 14.25L16.26 14.28L17.36 14.68L17.42 14.68L17.47 14.66L17.5 14.62L17.89 13.51L17.9 13.46L17.87 13.41L17.83 13.38L16.73 12.99ZM19.68 14.15L19.28 15.26L19.28 15.31L19.3 15.36L19.34 15.39L20.44 15.78L20.5 15.79L20.55 15.76L20.58 15.72L20.6 15.66L20.74 14.43L19.81 14.09L19.75 14.09L19.71 14.11ZM18.57 17.23L18.27 18.07L19.43 17.43L18.7 17.17L18.65 17.17L18.6 17.19ZM16.48 18.22L16.1 19.28L17.52 18.49L16.61 18.16L16.56 18.15L16.51 18.18Z'],
  ['#5C4000', 'M12.22 1.02L12.54 2.52L12.98 2.68L13.03 2.68L13.08 2.66L13.11 2.61L13.5 1.51L13.51 1.46L13.49 1.41L13.44 1.38L12.45 1.03L12.38 1.01L12.31 1L12.23 1.01ZM13.35 2.7L13.35 2.75L13.37 2.8L13.41 2.83L14.52 3.23L14.57 3.23L14.62 3.21L14.65 3.17L15.04 2.06L15.05 2.01L15.03 1.96L14.98 1.93L13.88 1.54L13.83 1.53L13.78 1.55L13.75 1.6ZM14.89 3.25L14.89 3.31L14.91 3.36L14.95 3.39L16.06 3.78L16.11 3.79L16.16 3.76L16.19 3.72L16.58 2.62L16.59 2.56L16.57 2.51L16.52 2.48L15.42 2.09L15.37 2.08L15.32 2.11L15.29 2.15ZM14.81 3.62L14.77 3.65L14.73 3.69L14.34 4.79L14.34 4.85L14.36 4.9L14.4 4.93L15.5 5.32L15.56 5.33L15.61 5.3L15.64 5.26L16.03 4.16L16.04 4.1L16.01 4.05L15.97 4.02L14.87 3.63ZM14.26 5.16L14.21 5.19L14.18 5.23L13.79 6.33L13.78 6.39L13.81 6.44L13.85 6.47L14.95 6.86L15.01 6.87L15.05 6.84L15.08 6.8L15.48 5.7L15.48 5.64L15.46 5.59L15.42 5.56L14.31 5.17ZM14.7 8.8L14.65 8.82L14.62 8.86L14.22 9.97L14.22 10.02L14.24 10.07L14.29 10.1L15.39 10.49L15.44 10.5L15.49 10.48L15.52 10.43L15.92 9.33L15.92 9.28L15.9 9.23L15.85 9.2L14.75 8.8ZM14.97 11.97L15.36 10.87L15.37 10.82L15.34 10.77L15.3 10.74L14.2 10.34L14.18 10.34L14.51 11.92L14.84 12.03L14.89 12.04L14.94 12.02ZM15.96 14.06L16.35 12.96L16.36 12.91L16.33 12.86L16.29 12.83L15.19 12.43L15.13 12.43L15.08 12.45L15.05 12.5L14.79 13.24L14.9 13.8L15.82 14.13L15.88 14.13L15.93 14.11ZM17.97 4.36L17.97 4.41L17.99 4.46L18.03 4.49L19.14 4.89L19.19 4.89L19.24 4.87L19.27 4.82L19.66 3.72L19.67 3.67L19.65 3.62L19.6 3.59L18.5 3.19L18.45 3.19L18.4 3.21L18.37 3.26ZM19.51 4.91L19.51 4.96L19.53 5.01L19.57 5.04L20.68 5.44L20.73 5.44L20.78 5.42L20.81 5.37L21.2 4.27L21.21 4.22L21.19 4.17L21.14 4.14L20.04 3.74L19.99 3.74L19.94 3.76L19.91 3.81ZM17.89 4.73L17.85 4.75L17.82 4.8L17.42 5.9L17.42 5.95L17.44 6L17.48 6.03L18.58 6.43L18.64 6.43L18.69 6.41L18.72 6.36L19.11 5.26L19.12 5.21L19.09 5.16L19.05 5.13L17.95 4.73ZM15.8 5.72L15.75 5.74L15.72 5.78L15.33 6.89L15.32 6.94L15.35 6.99L15.39 7.02L16.49 7.41L16.55 7.42L16.59 7.39L16.62 7.35L17.02 6.25L17.02 6.2L17 6.15L16.96 6.12L15.85 5.72ZM20.9 5.9L20.5 7L20.5 7.06L20.52 7.1L20.56 7.13L21.55 7.49L21.71 6.08L21.03 5.84L20.97 5.83L20.93 5.86ZM19.87 8.91L19.82 8.94L19.79 8.98L19.4 10.08L19.39 10.14L19.41 10.18L19.46 10.21L20.56 10.61L20.61 10.61L20.66 10.59L20.69 10.55L21.09 9.45L21.09 9.39L21.07 9.34L21.03 9.31L19.92 8.92ZM17.23 11.44L17.18 11.46L17.15 11.51L16.75 12.61L16.75 12.66L16.77 12.71L16.81 12.74L17.92 13.14L17.97 13.14L18.02 13.12L18.05 13.08L18.44 11.97L18.45 11.92L18.43 11.87L18.38 11.84L17.28 11.45ZM17.66 15.07L17.61 15.1L17.58 15.14L17.19 16.24L17.18 16.3L17.21 16.35L17.25 16.38L18.35 16.77L18.41 16.78L18.45 16.75L18.48 16.71L18.88 15.61L18.88 15.55L18.86 15.5L18.82 15.47L17.71 15.08Z'],
  ['#9A6700', 'M20.59 5.68L19.49 5.29L19.43 5.28L19.39 5.3L19.36 5.35L18.96 6.45L18.96 6.5L18.98 6.55L19.02 6.58L20.13 6.98L20.18 6.98L20.23 6.96L20.26 6.91L20.65 5.81L20.66 5.76L20.63 5.71ZM15.3 7.26L15.25 7.26L15.2 7.28L15.17 7.32L14.78 8.43L14.77 8.48L14.79 8.53L14.84 8.56L15.94 8.95L15.99 8.96L16.04 8.94L16.07 8.89L16.47 7.79L16.47 7.74L16.45 7.69L16.41 7.66ZM20.37 7.4L20.34 7.44L19.95 8.54L19.94 8.6L19.97 8.64L20.01 8.67L21.11 9.07L21.17 9.07L21.21 9.05L21.25 9.01L21.43 8.49L21.52 7.75L20.48 7.38L20.42 7.37ZM20.26 12.57L20.23 12.61L19.83 13.72L19.83 13.77L19.85 13.82L19.89 13.85L20.77 14.16L20.94 12.76L20.36 12.55L20.31 12.55ZM18.27 13.54L18.21 13.53L18.17 13.56L18.13 13.6L17.74 14.7L17.74 14.76L17.76 14.8L17.8 14.84L18.9 15.23L18.96 15.23L19.01 15.21L19.04 15.17L19.43 14.07L19.44 14.01L19.41 13.96L19.37 13.93ZM16.17 14.53L16.12 14.52L16.07 14.54L16.04 14.59L15.65 15.69L15.64 15.74L15.67 15.79L15.71 15.82L16.81 16.22L16.87 16.22L16.91 16.2L16.94 16.16L17.34 15.05L17.34 15L17.32 14.95L17.28 14.92ZM16.36 17.74L16.39 17.7L16.79 16.59L16.79 16.54L16.77 16.49L16.72 16.46L15.62 16.07L15.57 16.06L15.52 16.08L15.49 16.13L15.43 16.3L15.69 17.55L16.26 17.76L16.31 17.76Z'],
  ['#E3B341', 'M16.83 2.7L16.43 3.81L16.43 3.86L16.45 3.91L16.49 3.94L17.6 4.33L17.65 4.34L17.7 4.31L17.73 4.27L18.12 3.17L18.13 3.11L18.11 3.07L18.06 3.04L16.96 2.64L16.91 2.64L16.86 2.66ZM14.53 8.34L14.93 7.24L14.93 7.18L14.91 7.13L14.87 7.1L13.76 6.71L13.71 6.7L13.66 6.73L13.63 6.77L13.5 7.13L13.72 8.16L14.4 8.4L14.45 8.41L14.5 8.38ZM16.79 7.81L16.74 7.83L16.71 7.88L16.32 8.98L16.31 9.03L16.33 9.08L16.38 9.11L17.48 9.51L17.53 9.51L17.58 9.49L17.61 9.44L18.01 8.34L18.01 8.29L17.99 8.24L17.95 8.21L16.84 7.81ZM16.29 9.35L16.24 9.35L16.19 9.37L16.16 9.42L15.76 10.52L15.76 10.57L15.78 10.62L15.83 10.65L16.93 11.05L16.98 11.05L17.03 11.03L17.06 10.98L17.46 9.88L17.46 9.83L17.44 9.78L17.39 9.75ZM15.69 10.89L15.64 10.91L15.61 10.96L15.21 12.06L15.21 12.11L15.23 12.16L15.27 12.19L16.38 12.59L16.43 12.59L16.48 12.57L16.51 12.52L16.9 11.42L16.91 11.37L16.89 11.32L16.84 11.29L15.74 10.89ZM18.31 17.04L18.27 17.01L17.16 16.62L17.11 16.61L17.06 16.64L17.03 16.68L16.64 17.78L16.63 17.84L16.65 17.89L16.7 17.92L17.8 18.31L17.84 18.31L17.92 18.27L17.93 18.25L18.33 17.15L18.33 17.09ZM17.4 6.27L17.34 6.27L17.29 6.29L17.26 6.34L16.87 7.44L16.86 7.49L16.89 7.54L16.93 7.57L18.03 7.97L18.09 7.97L18.13 7.95L18.16 7.9L18.56 6.8L18.56 6.75L18.54 6.7L18.5 6.67ZM18.88 6.82L18.83 6.84L18.8 6.89L18.41 7.99L18.4 8.04L18.43 8.09L18.47 8.12L19.57 8.52L19.63 8.52L19.67 8.5L19.71 8.46L20.1 7.35L20.1 7.3L20.08 7.25L20.04 7.22L18.94 6.83ZM18.33 8.36L18.28 8.38L18.25 8.43L17.86 9.53L17.85 9.58L17.87 9.63L17.92 9.66L19.02 10.06L19.07 10.06L19.12 10.04L19.15 10L19.55 8.89L19.55 8.84L19.53 8.79L19.49 8.76L18.38 8.37ZM19.37 10.46L19.32 10.45L19.27 10.48L19.24 10.52L18.84 11.62L18.84 11.68L18.86 11.72L18.91 11.75L20.01 12.15L20.06 12.15L20.11 12.13L20.14 12.09L20.54 10.99L20.54 10.93L20.52 10.88L20.47 10.85ZM18.77 11.99L18.72 12.02L18.69 12.06L18.29 13.16L18.29 13.22L18.31 13.26L18.35 13.3L19.46 13.69L19.51 13.69L19.56 13.67L19.59 13.63L19.98 12.53L19.99 12.47L19.97 12.42L19.92 12.39L18.82 12ZM20.36 16.03L19.26 15.63L19.2 15.63L19.15 15.65L19.12 15.69L18.73 16.8L18.72 16.85L18.75 16.9L18.79 16.93L19.73 17.26L20.1 17.06L20.42 16.16L20.42 16.1L20.4 16.06Z'],
]

type Node = { type: string, props: Record<string, unknown> & { style?: Record<string, unknown>, children?: unknown } }
const h = (type: string, style: Record<string, unknown>, children?: unknown, props: Record<string, unknown> = {}): Node =>
  ({ type, props: { ...props, style: { display: 'flex', ...style }, children } })

/** Satori sets Norse a little high on the baseline: moved down by this much of the font size, measured. */
const NUDGE = 0.09
/** The mark, lifted 3.5% as on the site (logo-mark.ts): the word beside it centres on its bright A half. */
const markSvg = (size: number): Node =>
  h('svg', { width: size, height: size, position: 'relative', top: -size * .035 }, MARK.map(([fill, d]) => h('path', {}, undefined, { d, fill })), { viewBox: '0 0 24 24', width: size, height: size })

/** The gradient Angular icon of the press kit (https://angular.dev/press-kit), CC BY 4.0, © Google: `app-angular-logo`. */
const ANGULAR_LOGO = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 223 236"><path fill="url(#b)" d="m222.077 39.192-8.019 125.923L137.387 0l84.69 39.192Zm-53.105 162.825-57.933 33.056-57.934-33.056 11.783-28.556h92.301l11.783 28.556ZM111.039 62.675l30.357 73.803H80.681l30.358-73.803ZM7.937 165.115 0 39.192 84.69 0 7.937 165.115Z"/><path fill="url(#c)" d="m222.077 39.192-8.019 125.923L137.387 0l84.69 39.192Zm-53.105 162.825-57.933 33.056-57.934-33.056 11.783-28.556h92.301l11.783 28.556ZM111.039 62.675l30.357 73.803H80.681l30.358-73.803ZM7.937 165.115 0 39.192 84.69 0 7.937 165.115Z"/><defs><linearGradient id="b" x1="49.009" x2="225.829" y1="213.75" y2="129.722" gradientUnits="userSpaceOnUse"><stop stop-color="#E40035"/><stop offset=".24" stop-color="#F60A48"/><stop offset=".352" stop-color="#F20755"/><stop offset=".494" stop-color="#DC087D"/><stop offset=".745" stop-color="#9717E7"/><stop offset="1" stop-color="#6C00F5"/></linearGradient><linearGradient id="c" x1="41.025" x2="156.741" y1="28.344" y2="160.344" gradientUnits="userSpaceOnUse"><stop stop-color="#FF31D9"/><stop offset="1" stop-color="#FF5BE1" stop-opacity="0"/></linearGradient></defs></svg>')}`

/** The profile's stat icons (Octicons, MIT), as paths: filled, on a 16 grid. */
const ICONS = {
  pullRequests: ['M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005V3.25Z'],
  issues: ['M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z', 'M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z'],
  comments: ['M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0 1 13.25 12H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 13.543V12H2.75A1.75 1.75 0 0 1 1 10.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h4.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z'],
  reactions: ['M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm3.82 1.636a.75.75 0 0 1 1.038.175l.007.009c.103.118.22.222.35.31.264.178.683.37 1.285.37.602 0 1.02-.192 1.285-.371.13-.088.247-.192.35-.31l.007-.008a.75.75 0 0 1 1.222.87l-.022-.015c.02.013.021.015.021.015v.001l-.001.002-.002.003-.005.007-.014.019a2.066 2.066 0 0 1-.184.213c-.16.166-.338.316-.53.445-.63.418-1.37.638-2.127.629-.946 0-1.652-.308-2.126-.63a3.331 3.331 0 0 1-.715-.657l-.014-.02-.005-.006-.002-.003v-.002h-.001l.613-.432-.614.43a.75.75 0 0 1 .183-1.044ZM12 7a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM5 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm5.25 2.25.592.416a97.71 97.71 0 0 0-.592-.416Z'],
}
const STAT_ICON_SIZE = 40
const statIcon = (paths: string[], color: string): Node =>
  h('svg', { width: STAT_ICON_SIZE, height: STAT_ICON_SIZE }, paths.map(d => h('path', {}, undefined, { d })), {
    viewBox: '0 0 16 16', width: STAT_ICON_SIZE, height: STAT_ICON_SIZE, fill: color,
  })

const label = (value: number, one: string, many: string) => (value === 1 ? one : many)

/**
 * Text with the word "Angularian(s)" set in the brand font (its capitals are about as tall as Manrope's):
 * the pieces as flex items, so the line still wraps between them.
 */
function branded(text: string, style: Record<string, unknown>, brandColor?: string): Node {
  const size = Number(style.fontSize ?? 16)
  const pieces = text.split(/(Angularians?)/).filter(Boolean)
  return h('div', { flexWrap: 'wrap', alignItems: 'baseline', columnGap: size * .25, ...style }, pieces.map(piece => /^Angularians?$/.test(piece)
    ? h('span', { fontFamily: 'Norse', fontWeight: 700, fontSize: size, letterSpacing: size * .02, position: 'relative', top: size * NUDGE, ...(brandColor ? { color: brandColor } : {}) }, piece)
    : h('span', {}, piece.trim())))
}

/** `?period=`: a period with contributions, else all time (like the profile page). */
export function cardPeriod(profile: ContributorProfile, requested: unknown): Period {
  const period = periodOrNull(requested) ?? 'all'
  return period !== 'all' && profile.periods.some(row => row.period === period) ? period : 'all'
}

/** `avatar`: a data URL, or `null` when GitHub did not send it (a grey circle instead). */
export function cardTree(profile: ContributorProfile, period: Period, avatar: string | null, flag: { src: string, name: string } | null = null): Node {
  const stats = period === 'all' ? profile : profile.periods.find(row => row.period === period)!
  const since = profile.firstContributionAt ? new Date(profile.firstContributionAt).getUTCFullYear() : null
  const rows = [
    [
      { label: label(stats.pullRequests.all, 'Merged PR', 'Merged PRs'), value: stats.pullRequests.all, color: COLORS.pullRequests, icon: ICONS.pullRequests },
      { label: label(stats.issues, 'Issue', 'Issues'), value: stats.issues, color: COLORS.issues, icon: ICONS.issues },
    ],
    [
      { label: label(stats.comments + stats.reviewComments, 'Comment', 'Comments'), value: stats.comments + stats.reviewComments, color: COLORS.comments, icon: ICONS.comments },
      { label: label(stats.reactions, 'Reaction', 'Reactions'), value: stats.reactions, color: COLORS.reactions, icon: ICONS.reactions },
    ],
  ]
  return h('div', { width: '100%', height: '100%', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#0a0a0a', color: '#ffffff', paddingTop: 56, paddingRight: 64, paddingBottom: 44, paddingLeft: 64, fontFamily: 'Manrope' }, [
    h('div', { flexDirection: 'row', gap: 64 }, [
      h('div', { flexDirection: 'column', width: 380 }, [
        avatar
          ? h('img', { width: 124, height: 124, borderRadius: 9999, border: '4px solid #262626' }, undefined, { src: avatar, width: 124, height: 124 })
          : h('div', { width: 124, height: 124, borderRadius: 9999, backgroundColor: '#262626' }),
        h('div', { fontSize: 44, fontWeight: 600, marginTop: 16, maxWidth: 380, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, profile.username),
        h('div', { fontFamily: 'Norse', fontWeight: 700, fontSize: 96, lineHeight: 1, letterSpacing: 2, color: BRAND, marginTop: 8 }, `#${formatNumber(period === 'all' ? profile.rank : stats.rank)}`),
        h('div', { fontSize: 30, fontWeight: 600, color: BRAND, marginTop: 4 }, formatPoints(stats.score)),
        ...(period !== 'all' ? [h('div', { fontSize: 24, color: '#a3a3a3', marginTop: 4 }, periodPhrase(period))] : []),
        ...(flag ? [h('div', { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: period === 'all' ? 10 : 4, fontSize: 24, color: '#a3a3a3' }, [
          h('img', { width: 30, height: 30 }, undefined, { src: flag.src, width: 30, height: 30 }),
          h('div', {}, flag.name),
        ])] : []),
      ]),
      h('div', { flexDirection: 'column', flex: 1, gap: 24 }, rows.map(row =>
        h('div', { flexDirection: 'row', gap: 24 }, row.map(stat =>
          h('div', { flexDirection: 'column', justifyContent: 'space-between', flex: 1, height: 196, borderRadius: 24, padding: 24, border: `2px solid ${stat.color}`, backgroundColor: `${stat.color}12` }, [
            statIcon(stat.icon, stat.color),
            h('div', { flexDirection: 'column' }, [
              h('div', { fontSize: 58, fontWeight: 600, lineHeight: 1.1 }, formatNumber(stat.value)),
              h('div', { fontSize: 26, marginTop: 2, color: stat.color }, stat.label),
            ]),
          ])),
        ))),
    ]),
    h('div', { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #262626', paddingTop: 18 }, [
      h('div', { flexDirection: 'row', alignItems: 'center', gap: 14 }, [
        h('img', { width: 58, height: 62 }, undefined, { src: ANGULAR_LOGO, width: 58, height: 62 }),
        h('div', { flexDirection: 'column' }, [
          h('div', { fontSize: 26, fontWeight: 600, lineHeight: 1.15, whiteSpace: 'nowrap' }, 'Angular contributor'),
          ...(since ? [h('div', { fontSize: 20, lineHeight: 1.2, color: '#a3a3a3' }, `since ${since}`)] : []),
        ]),
      ]),
      h('div', { flexDirection: 'row', alignItems: 'center', gap: 12 }, [
        markSvg(68),
        h('div', { flexDirection: 'column' }, [
          h('div', { fontFamily: 'Norse', fontWeight: 700, fontSize: 30, lineHeight: 1, letterSpacing: 1, color: BRAND }, 'Angularians'),
          h('div', { fontSize: 20, lineHeight: 1.2, color: '#a3a3a3' }, 'angularians.dev'),
        ]),
      ]),
    ]),
  ])
}

/**
 * The home page's link preview: the mark, the title, a line of totals and the first avatars of the board.
 * After nuxt.com's `/nuxters` card (its `Docs` template with a "Community" headline).
 */
export function homeTree(input: { title: string, description: string, avatars: Array<string | null> }): Node {
  const avatars = input.avatars.slice(0, 8)
  return h('div', { width: '100%', height: '100%', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#0a0a0a', color: '#ffffff', padding: 72, fontFamily: 'Manrope' }, [
    h('div', { flexDirection: 'column' }, [
      h('div', { alignItems: 'center', gap: 16 }, [
        markSvg(56),
        // Norse's capitals sit high in their line box: moved down so they centre on the mark.
        h('div', { fontFamily: 'Norse', fontWeight: 700, fontSize: 48, letterSpacing: 1, color: BRAND, lineHeight: 1, marginTop: 13 }, 'Angularians'),
      ]),
      branded(input.title, { fontSize: 76, fontWeight: 600, marginTop: 48, lineHeight: 1.1 }, BRAND),
      h('div', { fontSize: 32, color: '#a3a3a3', marginTop: 24, maxWidth: 980, lineHeight: 1.35 }, input.description),
    ]),
    h('div', { alignItems: 'center', justifyContent: 'space-between' }, [
      h('div', { alignItems: 'center' }, avatars.map((avatar, index) => avatar
        ? h('img', { width: 88, height: 88, borderRadius: 9999, border: '4px solid #0a0a0a', marginLeft: index ? -18 : 0 }, undefined, { src: avatar, width: 88, height: 88 })
        : h('div', { width: 88, height: 88, borderRadius: 9999, border: '4px solid #0a0a0a', backgroundColor: '#262626', marginLeft: index ? -18 : 0 }))),
      h('div', { fontSize: 26, color: '#737373' }, 'angularians.dev'),
    ]),
  ])
}

export interface CardFonts { regular: ArrayBuffer | Buffer, semibold: ArrayBuffer | Buffer, brand?: ArrayBuffer | Buffer | null }

export async function renderCard(tree: Node, fonts: CardFonts): Promise<Buffer> {
  const svg = await satori(tree as never, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts: [
      { name: 'Manrope', data: fonts.regular, weight: 400, style: 'normal' },
      { name: 'Manrope', data: fonts.semibold, weight: 600, style: 'normal' },
      ...(fonts.brand ? [{ name: 'Norse', data: fonts.brand, weight: 700 as const, style: 'normal' as const }] : []),
    ],
  })
  return new Resvg(svg, { fitTo: { mode: 'width', value: CARD_WIDTH * PIXEL_RATIO } }).render().asPng()
}
