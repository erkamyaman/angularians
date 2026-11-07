import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { MeCard } from './me-card';

describe('MeCard', () => {
  function render(angularian: object | null) {
    const state = signal({ enabled: true, user: { githubId: 1, login: 'newcomer', angularian, badges: [] } });
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: AuthService, useValue: { state, wasSignedIn: () => true, loginUrl: () => '/login' } }] });
    const fixture = TestBed.createComponent(MeCard);
    fixture.detectChanges();
    return [...fixture.nativeElement.querySelectorAll('a[target="_blank"]')].map((link: Element) => link.getAttribute('href'));
  }

  it('offers the first steps to someone with no contributions', () => {
    expect(render(null)).toEqual(['https://github.com/angular/angular/blob/main/CONTRIBUTING.md', 'https://discord.gg/angular', 'https://github.com/erkamyaman', 'https://github.com/erkamyaman/angular-contribution-skill', 'https://www.youtube.com/watch?v=_KfE1fnZphc']);
  });

  it('links the avatar and name of a contributor to their profile', () => {
    const state = signal({ enabled: true, user: { githubId: 1, login: 'renamed', angularian: { username: 'original', rank: 9, score: 3, periods: [], pullRequests: { all: 1 }, helpfulIssues: 0, helpfulComments: 0, packages: [], socialAccounts: [] }, badges: [] } });
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: AuthService, useValue: { state, wasSignedIn: () => true, loginUrl: () => '/login' } }] });
    const fixture = TestBed.createComponent(MeCard);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('a[aria-label="Profile of original"]')?.getAttribute('href')).toBe('/original');
    expect(element.querySelector('a[aria-label="Profile of original"] img')).not.toBeNull();
    expect([...element.querySelectorAll('a')].find(link => link.textContent?.trim() === 'renamed')?.getAttribute('href')).toBe('/original');
  });

  it('does not offer them to a contributor', () => {
    expect(render({ username: 'newcomer', rank: 9, score: 3, periods: [], pullRequests: { all: 1 }, helpfulIssues: 0, helpfulComments: 0, packages: [], socialAccounts: [] })).toEqual([]);
  });
});
