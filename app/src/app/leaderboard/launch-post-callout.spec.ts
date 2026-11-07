import { TestBed } from '@angular/core/testing'
import { LaunchPostCallout } from './launch-post-callout'

describe('LaunchPostCallout', () => {
  it('links the whole box to the post, in a new tab, with its title in the sentence', () => {
    const fixture = TestBed.createComponent(LaunchPostCallout)
    fixture.componentRef.setInput('post', { title: 'Carve your name in ng-halla', href: 'https://example.com/post' })
    fixture.detectChanges()
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a')
    expect(link.href).toBe('https://example.com/post')
    expect(link.target).toBe('_blank')
    expect(link.querySelector('strong')!.textContent).toBe('Carve your name in ng-halla')
    expect(link.textContent).toContain('Read the announcement')
  })
})
