import { describe, expect, it } from 'vitest'
import { TRANSLATIONS, translationsOf } from '../src/translations.ts'

describe('translationsOf', () => {
  it('finds every translation a contributor translated, in the footer order', () => {
    expect(translationsOf(1446119).map(translation => translation.language)).toEqual(['简体中文', '正體中文'])
    expect(translationsOf(88717125).map(translation => translation.language)).toEqual(['Türkçe'])
  })

  it('finds none for someone who translated nothing', () => {
    expect(translationsOf(1)).toEqual([])
  })

  it('lists each translator once per translation, with a date it joined the footer', () => {
    for (const { translators, joinedAt } of TRANSLATIONS) {
      expect(new Set(translators.map(translator => translator.githubId)).size).toBe(translators.length)
      expect(joinedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})
