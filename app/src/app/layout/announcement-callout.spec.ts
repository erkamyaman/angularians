import { TestBed } from '@angular/core/testing'
import { AnnouncementCallout } from './announcement-callout'

describe('AnnouncementCallout', () => {
  it('links the whole box to the post, in a new tab, with its title in the sentence', () => {
    const fixture = TestBed.createComponent(AnnouncementCallout)
    fixture.componentRef.setInput('title', 'Carve your name in ng-halla')
    fixture.componentRef.setInput('href', 'https://example.com/post')
    fixture.detectChanges()
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a')
    expect(link.href).toBe('https://example.com/post')
    expect(link.target).toBe('_blank')
    expect(link.querySelector('strong')!.textContent).toBe('Carve your name in ng-halla')
    expect(link.textContent).toContain('Read the announcement')
  })
})
