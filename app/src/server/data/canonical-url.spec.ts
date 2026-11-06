import { describe, expect, it } from 'vitest'
import { canonicalRedirect } from './canonical-url'

describe('canonicalRedirect', () => {
  it.each([
    ['angularians.dev', '/', null],
    ['angularians.dev', '/erkamyaman', null],
    ['angularians.dev', '/?period=2025&country=TR', null],
    ['angularians.dev', '/erkamyaman/', '/erkamyaman'],
    ['angularians.dev', '/erkamyaman//?period=2025', '/erkamyaman?period=2025'],
    ['angularians.dev', '/api/contributors/', '/api/contributors'],
    ['angularians.netlify.app', '/', 'https://angularians.dev/'],
    ['ANGULARIANS.NETLIFY.APP:443', '/erkamyaman/?period=2025', 'https://angularians.dev/erkamyaman?period=2025'],
    ['deploy-preview-12--angularians.netlify.app', '/erkamyaman', null],
    ['localhost:4202', '/erkamyaman', null],
    [undefined, '/', null],
    // Never to another site: a path starting with `//` or `/\` would be read as a host.
    ['angularians.dev', '//evil.com/', '/evil.com'],
    ['angularians.dev', '//evil.com//', '/evil.com'],
    ['angularians.dev', '/\\evil.com/', '/evil.com'],
    ['angularians.dev', '///evil.com/?x=1', '/evil.com?x=1'],
    ['angularians.dev', '//', '/'],
    ['angularians.dev', '//evil.com', '/evil.com'],
    ['angularians.netlify.app', '//evil.com/', 'https://angularians.dev/evil.com'],
  ] as const)('%s %s → %s', (host, url, target) => {
    expect(canonicalRedirect(host, url)).toBe(target)
  })
})
