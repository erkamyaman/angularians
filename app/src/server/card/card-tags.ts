import type { TagColors } from './tag-colors'

export interface CardTag {
  src: string
  label: string | null
  colors: TagColors
  row: number
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

export const TAG_FONTS = [
  { name: 'Manrope Latin Ext', file: 'manrope-latin-ext-600-normal.woff' },
  { name: 'Manrope Cyrillic', file: 'manrope-cyrillic-600-normal.woff' },
  { name: 'Noto Sans KR', file: 'noto-sans-kr-subset-600.ttf' },
  { name: 'Noto Sans JP', file: 'noto-sans-jp-subset-600.ttf' },
  { name: 'Noto Sans SC', file: 'noto-sans-sc-subset-600.ttf' },
  { name: 'Noto Sans TC', file: 'noto-sans-tc-subset-600.ttf' },
] as const

const AVERAGE_LETTER = 0.55
const TAG_CHROME = TAG_PADDING * 2 + TAG_ICON_SIZE + TAG_GAP + 2
const DRAWABLE = /^[\u0000-ɏəЀ-ӿ -⁯한국어日本語简体中文正體]+$/
const FULL_WIDTH = /[　-鿿가-힯]/g

export function drawableLabel(label: string): string {
  const text = label.replaceAll('ʻ', '‘')
  const words = text.split(' ').filter(word => DRAWABLE.test(word))
  if (words.length === text.split(' ').length) return text
  const kept = words.join(' ')
  return `${kept.charAt(0).toUpperCase()}${kept.slice(1)}`
}

function labelledWidth(label: string): number {
  const full = label.match(FULL_WIDTH)?.length ?? 0
  return Math.ceil((full + (label.length - full) * AVERAGE_LETTER) * TAG_FONT_SIZE) + TAG_CHROME
}

export function fitTags<T extends { src: string, label: string }>(badges: readonly T[], rows = TAG_ROWS, width = TAG_ROW_WIDTH, iconsOnly = false): Array<Omit<T, 'label'> & { label: string | null, row: number }> {
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
  return lines.flatMap((line, index) => line.tags.map(tag => ({ ...tag, row: index + 1 })))
}
