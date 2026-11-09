import { TRANSLATIONS } from '@angularians/shared'
import { describe, expect, it } from 'vitest'
import { drawableLabel } from './tag-fonts'

describe('drawableLabel', () => {
  it('keeps a label the card font can draw', () => {
    expect(drawableLabel('Français translator')).toBe('Français translator')
    expect(drawableLabel('Türkçe translator')).toBe('Türkçe translator')
    expect(drawableLabel('#1 in 2019–2021')).toBe('#1 in 2019–2021')
  })

  it('keeps every language on the list', () => {
    for (const { language } of TRANSLATIONS) expect(drawableLabel(`${language} translator`)).not.toBe('Translator')
  })

  it('draws the Uzbek letter mark with a quote the font has', () => {
    expect(drawableLabel('Oʻzbekcha translator')).toBe('O‘zbekcha translator')
  })

  it('drops the words it cannot draw and capitalises what is left', () => {
    expect(drawableLabel('ไทย translator')).toBe('Translator')
    expect(drawableLabel('العربية contributor')).toBe('Contributor')
  })
})
