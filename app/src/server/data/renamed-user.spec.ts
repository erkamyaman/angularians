import { describe, expect, it } from 'vitest'
import { renamedUserRedirect } from './renamed-user'

const renamedTo = (name: string) => (name.toLowerCase() === 'oldname' ? 'NewName' : null)

describe('renamedUserRedirect', () => {
  it.each([
    ['/oldname', '/NewName'],
    ['/OldName', '/NewName'],
    ['/oldname?period=2025', '/NewName?period=2025'],
    ['/oldname/card.png', '/NewName/card.png'],
    ['/oldname/card.png?period=2025&flag=TR', '/NewName/card.png?period=2025&flag=TR'],
    ['/someone', null],
    ['/', null],
    ['/api/contributors/oldname', null],
    ['/oldname/other', null],
    ['/sitemap.xml', null],
    ['/og.png', null],
  ] as const)('%s → %s', (url, target) => {
    expect(renamedUserRedirect(url, renamedTo)).toBe(target)
  })
})
