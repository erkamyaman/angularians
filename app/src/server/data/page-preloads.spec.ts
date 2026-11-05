import { describe, expect, it } from 'vitest'
import { pageModule, pagePreloads, withPreloads, type ClientManifest } from './page-preloads'

const manifest: ClientManifest = {
  'index.html': { file: 'assets/index-1.js', imports: ['_core-1.js'] },
  '_core-1.js': { file: 'assets/core-1.js' },
  '_dialog-1.js': { file: 'assets/dialog-1.js', imports: ['_core-1.js', 'index.html'] },
  'src/app/pages/index.page.ts': { file: 'assets/index.page-1.js', imports: ['_core-1.js', 'index.html', '_dialog-1.js'] },
}

describe('page preloads', () => {
  it('maps a path to its page', () => {
    expect(pageModule('/?period=all')).toBe('src/app/pages/index.page.ts')
    expect(pageModule('/crisbeto?country=TR')).toBe('src/app/pages/[username].page.ts')
    expect(pageModule('/a/b')).toBe('src/app/pages/[...not-found].page.ts')
  })

  it('collects the page chunk and its imports, never the entry', () => {
    expect(pagePreloads(manifest, 'src/app/pages/index.page.ts')).toEqual(['assets/index.page-1.js', 'assets/core-1.js', 'assets/dialog-1.js'])
    expect(pagePreloads(manifest, 'missing')).toEqual([])
  })

  it('adds only the chunks the page does not already load', () => {
    const html = '<head><link rel="modulepreload" href="/assets/core-1.js"></head>'
    expect(withPreloads(html, ['assets/core-1.js', 'assets/dialog-1.js'])).toBe(
      '<head><link rel="modulepreload" href="/assets/core-1.js"><link rel="modulepreload" crossorigin href="/assets/dialog-1.js"></head>',
    )
    expect(withPreloads(html, ['assets/core-1.js'])).toBe(html)
  })
})
