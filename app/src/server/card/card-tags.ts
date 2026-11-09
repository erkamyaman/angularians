import type { TagColors } from './tag-colors'

export interface CardTag {
  src: string
  label: string | null
  colors: TagColors
  row: number
  large: boolean
}

export const TAG_ROWS = 3
export const TAG_ROW_WIDTH = 628
export const TAG_HEIGHT = 36
export const TAG_GAP = 8
export const TAG_FONT_SIZE = 19
export const TAG_ICON_SIZE = 28
export const TAG_PADDING = 12
export const TAG_ICON_WIDTH = 40
export const TAG_LARGE_SIZE = 60
export const TAG_LARGE_ICON = 44

const AVERAGE_LETTER = 0.55
const TAG_CHROME = TAG_PADDING * 2 + TAG_ICON_SIZE + TAG_GAP + 2
const FULL_WIDTH = /[\u3000-\u9fff\uac00-\ud7af]/g

function labelledWidth(label: string): number {
  const full = label.match(FULL_WIDTH)?.length ?? 0
  return Math.ceil((full + (label.length - full) * AVERAGE_LETTER) * TAG_FONT_SIZE) + TAG_CHROME
}

export function fitTags<T extends { src: string, label: string }>(badges: readonly T[], rows: number, width: number, iconsOnly = false): Array<Omit<T, 'label'> & { label: string | null, row: number, large: boolean }> {
  type Tag = Omit<T, 'label'> & { label: string | null }
  const lines = Array.from({ length: rows }, () => ({ used: 0, tags: [] as Tag[] }))
  const place = (tag: Tag, size: number): boolean => {
    const line = lines.find(({ used }) => used + (used ? TAG_GAP : 0) + size <= width)
    if (!line) return false
    line.used += (line.used ? TAG_GAP : 0) + size
    line.tags.push(tag)
    return true
  }
  for (const badge of badges) {
    if (iconsOnly || !place(badge, labelledWidth(badge.label))) place({ ...badge, label: null }, iconsOnly ? TAG_LARGE_SIZE : TAG_ICON_WIDTH)
  }
  return lines.flatMap((line, index) => line.tags.map(tag => ({ ...tag, row: index + 1, large: iconsOnly })))
}
