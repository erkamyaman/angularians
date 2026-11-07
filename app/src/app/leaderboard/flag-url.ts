/** A round flag (circle-flags, copied to public/flags by scripts/copy-flags.ts). */
export function flagUrl(code: string): string {
  return `/flags/${code.toLowerCase()}.svg`
}
