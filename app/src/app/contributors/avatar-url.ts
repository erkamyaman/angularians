/**
 * A GitHub avatar by account id: stable across renames, served by GitHub's CDN.
 * `size` is in CSS pixels; GitHub gets twice that for 2x screens.
 */
export function avatarUrl(githubId: number, size: number): string {
  return `https://avatars.githubusercontent.com/u/${githubId}?s=${size * 2}&v=4`
}

/** The avatar at several widths: with `sizes`, the browser takes the smallest that fills its tile on that screen. */
export function avatarSrcset(githubId: number): string {
  return [64, 112, 160, 224].map(pixels => `${avatarUrl(githubId, pixels / 2)} ${pixels}w`).join(', ')
}
