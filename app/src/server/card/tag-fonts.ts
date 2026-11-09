export const TAG_FONTS = [
  { name: 'Manrope Latin Ext', file: 'manrope-latin-ext-600-normal.woff' },
  { name: 'Manrope Cyrillic', file: 'manrope-cyrillic-600-normal.woff' },
  { name: 'Noto Sans KR', file: 'noto-sans-kr-subset-600.ttf' },
  { name: 'Noto Sans JP', file: 'noto-sans-jp-subset-600.ttf' },
  { name: 'Noto Sans SC', file: 'noto-sans-sc-subset-600.ttf' },
  { name: 'Noto Sans TC', file: 'noto-sans-tc-subset-600.ttf' },
] as const

const DRAWABLE = /^[\u0000-\u024f\u0259\u0400-\u04ff\u2000-\u206f한국어日本語简体中文正體]+$/

export function drawableLabel(label: string): string {
  const text = label.replaceAll('\u02bb', '\u2018')
  const words = text.split(' ').filter(word => DRAWABLE.test(word))
  if (words.length === text.split(' ').length) return text
  const kept = words.join(' ')
  return `${kept.charAt(0).toUpperCase()}${kept.slice(1)}`
}
