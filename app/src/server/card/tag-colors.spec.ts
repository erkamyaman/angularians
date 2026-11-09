import { readFileSync } from 'node:fs'
import { TRANSLATIONS } from '@angularians/shared'
import { describe, expect, it } from 'vitest'
import type { BadgeTone } from '../../app/profile/badge-pill'
import { PROJECT_BADGES } from '../../app/profile/project-badges'
import { TAG_COLORS, tagColors } from './tag-colors'

const css = readFileSync('src/app/profile/badge-pill.css', 'utf8')
const darkRules = [...css.matchAll(/:host-context\(\.dark\) \.tone-([\w-]+) \{\s*--pill-text: (#[0-9A-Fa-f]{6});/g)]

describe('TAG_COLORS', () => {
  it('has the dark text of every badge tone that sets one', () => {
    expect(darkRules.length).toBeGreaterThan(10)
    for (const [, tone, text] of darkRules) expect(TAG_COLORS[tone as BadgeTone]?.text, tone).toBe(text)
  })

  it('covers every translation and project', () => {
    for (const { code } of TRANSLATIONS) expect(TAG_COLORS[`lang-${code}`], code).toBeDefined()
    for (const { tone } of PROJECT_BADGES) expect(TAG_COLORS[tone], tone).toBeDefined()
  })

  it('falls back to a neutral colour for a new language', () => {
    expect(tagColors('lang-xx').pill).toBe('#A3A3A3')
  })
})
