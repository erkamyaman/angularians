import { describe, expect, it } from 'vitest'
import { fitTags, TAG_ICON_WIDTH, TAG_LARGE_SIZE } from './card-tags'

const badge = (label: string) => ({ src: `data:${label}`, label })

describe('fitTags', () => {
  it('labels every tag that fits, in order', () => {
    expect(fitTags([badge('Français translator'), badge('Reviewer')], 2, 628).map(tag => tag.label)).toEqual(['Français translator', 'Reviewer'])
  })

  it('moves a tag that does not fit to the next row', () => {
    const tags = fitTags([badge('a'.repeat(30)), badge('b'.repeat(30))], 2, 410)
    expect(tags.map(tag => tag.label)).toEqual(['a'.repeat(30), 'b'.repeat(30)])
  })

  it('keeps the icon alone when the rows are full of labels', () => {
    const tags = fitTags([badge('a'.repeat(30)), badge('b'.repeat(30))], 1, 460)
    expect(tags).toEqual([{ ...badge('a'.repeat(30)), row: 1, large: false }, { src: `data:${'b'.repeat(30)}`, label: null, row: 1, large: false }])
  })

  it('draws only icons when asked', () => {
    expect(fitTags([badge('Reviewer'), badge('Creator')], 3, 628, true).map(tag => tag.label)).toEqual([null, null])
  })

  it('gives icons alone the large size', () => {
    const icons = [badge('a'), badge('b'), badge('c')]
    expect(fitTags(icons, 1, TAG_LARGE_SIZE * 2 + 8, true).length).toBe(2)
  })

  it('says which row each tag is in', () => {
    const tags = fitTags([badge('a'.repeat(30)), badge('b'.repeat(30)), badge('c'.repeat(30))], 3, 410)
    expect(tags.map(tag => tag.row)).toEqual([1, 2, 3])
  })

  it('leaves out what does not fit even as an icon', () => {
    const icons = Array.from({ length: 20 }, (_, index) => badge(`badge number ${index}`))
    expect(fitTags(icons, 1, TAG_ICON_WIDTH).length).toBe(1)
  })

  it('puts a short tag in an earlier row that still has room', () => {
    const tags = fitTags([badge('a'.repeat(10)), badge('b'.repeat(40)), badge('c'.repeat(5))], 2, 520)
    expect(tags.map(tag => tag.label)).toEqual(['a'.repeat(10), 'c'.repeat(5), 'b'.repeat(40)])
  })

  it('counts Korean, Japanese and Chinese letters as full width', () => {
    expect(fitTags([badge('简体中文简体中文简体中文 translator')], 1, 400).map(tag => tag.label)).toEqual([null])
  })

  it('still draws an icon after a label too long for any row', () => {
    const tags = fitTags([badge('a'.repeat(200)), badge('Reviewer')], 1, 300)
    expect(tags.map(tag => tag.label)).toEqual([null, 'Reviewer'])
  })
})
