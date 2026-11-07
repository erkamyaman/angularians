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

  function renderState(state: object | null, wasSignedIn: boolean): HTMLElement {
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: AuthService, useValue: { state: signal(state), wasSignedIn: () => wasSignedIn, loginUrl: () => '/login' } }] });
    const fixture = TestBed.createComponent(MeCard);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  const contributor = (periods: object[]) => ({ username: 'someone', rank: 9, score: 3, periods, pullRequests: { all: 1 }, helpfulIssues: 0, helpfulComments: 0, packages: [], socialAccounts: [] });
  const text = (element: Element | null | undefined) => element?.textContent?.replace(/\s+/g, ' ').trim();

  it('draws the skeleton while the session of a visitor signed in last time loads', () => {
    const element = renderState(null, true);
    expect(element.querySelector('section')).toBeNull();
    expect(element.querySelector('[hlmSkeleton]')).not.toBeNull();
  });

  it('puts the sign-in in the skeleton\'s place when the session of a returning visitor has ended', () => {
    const element = renderState({ enabled: true, user: null }, true);
    const signIn = element.querySelector('section.signed-out');
    expect(signIn?.classList).toContain('returning');
    expect(signIn?.classList).not.toContain('sign-in-only');
    expect(signIn?.querySelector('a[href="/login"]')).not.toBeNull();
    // the skeleton, unseen, holds the place
    const sizer = element.querySelector('.stack > .invisible');
    expect(sizer?.getAttribute('aria-hidden')).toBe('true');
    expect(sizer?.querySelector('[hlmSkeleton]')).not.toBeNull();
  });

  it('draws the sign-in alone for a visitor who was not signed in', () => {
    const element = renderState({ enabled: true, user: null }, false);
    const signIn = element.querySelector('section.signed-out');
    expect(signIn?.classList).toContain('sign-in-only');
    expect(signIn?.classList).not.toContain('returning');
    expect(element.querySelector('[hlmSkeleton]')).toBeNull();
  });

  it('says the last 12 months\' rank, or that there were no contributions in them', () => {
    const line = (element: HTMLElement) => text([...element.querySelectorAll('section p')].find(p => p.textContent?.includes('12 months')));
    const ranked = renderState({ enabled: true, user: { githubId: 1, login: 'someone', angularian: contributor([{ period: '12m', rank: 42 }]), badges: ['Angularian'] } }, true);
    expect(line(ranked)).toBe('#42 in the last 12 months');
    TestBed.resetTestingModule();
    const quiet = renderState({ enabled: true, user: { githubId: 1, login: 'someone', angularian: contributor([]), badges: ['Angularian'] } }, true);
    expect(line(quiet)).toBe('No contributions in the last 12 months');
  });
});
