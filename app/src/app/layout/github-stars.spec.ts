import { TestBed } from '@angular/core/testing'
import { vi } from 'vitest'
import { GithubStars, STARS_KEY } from './github-stars'

const settle = async (fixture: ReturnType<typeof TestBed.createComponent<GithubStars>>) => {
  await fixture.whenStable()
  await new Promise(resolve => setTimeout(resolve))
  fixture.detectChanges()
}

describe('GithubStars', () => {
  beforeEach(() => sessionStorage.clear())
  afterEach(() => vi.unstubAllGlobals())

  it('shows the count from GitHub and remembers it for the visit', async () => {
    const request = vi.fn(async () => ({ ok: true, json: async () => ({ stargazers_count: 1234 }) }))
    vi.stubGlobal('fetch', request)
    const fixture = TestBed.createComponent(GithubStars)
    await settle(fixture)
    const link: HTMLElement = fixture.nativeElement.querySelector('a')
    expect(link.textContent).toContain('1,234')
    expect(link.getAttribute('aria-label')).toBe('Angularians on GitHub, 1,234 stars')
    expect(sessionStorage.getItem(STARS_KEY)).toBe('1234')
  })

  it('uses the remembered count without asking GitHub', async () => {
    sessionStorage.setItem(STARS_KEY, '17')
    const request = vi.fn()
    vi.stubGlobal('fetch', request)
    const fixture = TestBed.createComponent(GithubStars)
    await settle(fixture)
    expect(fixture.nativeElement.textContent).toContain('17')
    expect(request).not.toHaveBeenCalled()
  })

  it('stays a plain GitHub link when the count cannot load', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) })))
    const fixture = TestBed.createComponent(GithubStars)
    await settle(fixture)
    const link: HTMLElement = fixture.nativeElement.querySelector('a')
    expect(link.getAttribute('aria-label')).toBe('Angularians on GitHub')
    expect(link.querySelector('.stars')).toBeNull()
  })
})
