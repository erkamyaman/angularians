import { onTestFinished } from 'vitest';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { avatarUrl, boardTotals, formatDate, formatMonth, formatPoints, formatRank, matchesCountry, plural, pluralWord, profileQuery, statWord } from './format';
import { CountrySelect } from './country-select';
import { LeaderboardGrid } from './leaderboard-grid';
import { MeCard } from './me-card';
import { untilNextCollection } from './next-update';
import { PeriodTabs } from './period-tabs';

describe('format', () => {
  it('formats points, plurals and dates the same on server and browser', () => {
    expect(formatPoints(1)).toBe('1 pt');
    expect(formatPoints(5539)).toBe('5,539 pts');
    expect(plural(1, 'person', 'people')).toBe('1 person');
    expect(plural(2194, 'person', 'people')).toBe('2,194 people');
    expect(pluralWord(1, 'Issue', 'Issues')).toBe('Issue');
    expect(pluralWord(0, 'Issue', 'Issues')).toBe('Issues');
    expect(formatRank(12345)).toBe('#12,345');
    expect(statWord('pullRequests', 1)).toBe('Merged PR');
    expect(statWord('reactions', 0)).toBe('Reactions');
    expect(formatDate('2026-11-03T23:59:00Z')).toBe('Nov 3, 2026');
    expect(formatMonth('2025-04-30T23:59:00Z')).toBe('Apr 2025');
  });

  it("sums a board's totals, review comments with the comments, and names the country", () => {
    const board = { total: 1, landedPullRequests: 2194, issues: 1, comments: 3, reviewComments: 2, country: 'DE' };
    expect(boardTotals(board).map(({ color, value, words }) => [color, value, words])).toEqual([
      [null, 1, 'contributor from Germany'],
      ['purple', 2194, 'merged PRs'],
      ['green', 1, 'issue'],
      ['blue', 5, 'comments'],
    ]);
    expect(boardTotals({ ...board, total: 2, country: null })[0].words).toBe('contributors');
  });

  it('links avatars by GitHub id at 2x, and profiles to the board period', () => {
    expect(avatarUrl(4450522, 112)).toBe('https://avatars.githubusercontent.com/u/4450522?s=224&v=4');
    expect(profileQuery('all')).toEqual({});
    expect(profileQuery('2019')).toEqual({ period: '2019' });
    expect(profileQuery('2019', 'DE')).toEqual({ period: '2019', country: 'DE' });
    expect(profileQuery('all', 'TR')).toEqual({ country: 'TR' });
  });
});

describe('PeriodTabs', () => {
  function render(period: string, periods: string[], ranks: Record<string, number> | null = null) {
    const fixture = TestBed.createComponent(PeriodTabs);
    fixture.componentRef.setInput('period', period);
    fixture.componentRef.setInput('periods', periods);
    fixture.componentRef.setInput('ranks', ranks);
    fixture.detectChanges();
    return fixture;
  }

  it('shows a tab per rolling window and all time, and the years in a picker', () => {
    const element: HTMLElement = render('12m', ['30d', '12m', 'all', '2026', '2025']).nativeElement;
    expect([...element.querySelectorAll('[role="tab"]')].map(tab => tab.textContent?.trim())).toEqual(['30 days', '12 months', 'All time']);
    expect(element.querySelector('[role="combobox"]')?.getAttribute('aria-label')).toBe('Year');
  });

  it('shows the rank of each period next to it on a profile, like Nuxters', () => {
    const fixture = render('2025', ['30d', '12m', 'all', '2025'], { '30d': 9, '12m': 7, 'all': 1028, '2025': 2 });
    const element: HTMLElement = fixture.nativeElement;
    const tabs = [...element.querySelectorAll('[role="tab"]')].map(tab => tab.textContent?.replace(/\s+/g, ' ').trim());
    expect(tabs).toEqual(['30 days #9', '12 months #7', 'All time #1,028']);
    // The picked year shows its rank on the closed picker too.
    expect(element.querySelector('[role="combobox"]')?.textContent?.trim()).toBe('2025 #2');
  });

  it('leaves out ranks for periods without one', () => {
    const element: HTMLElement = render('all', ['30d', 'all'], { all: 3 }).nativeElement;
    expect([...element.querySelectorAll('[role="tab"]')].map(tab => tab.textContent?.replace(/\s+/g, ' ').trim())).toEqual(['30 days', 'All time #3']);
  });

  it('only offers the periods with data', () => {
    const element: HTMLElement = render('all', ['all']).nativeElement;
    expect([...element.querySelectorAll('[role="tab"]')].map(tab => tab.textContent?.trim())).toEqual(['All time']);
    expect(element.querySelector('[role="combobox"]')).toBeNull();
  });

  it('emits a picked tab once, and nothing for the current one', () => {
    const fixture = render('12m', ['30d', '12m', 'all']);
    const picked: string[] = [];
    fixture.componentInstance.periodChange.subscribe(value => picked.push(value));
    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]') as NodeListOf<HTMLButtonElement>;
    tabs[1]!.click();
    tabs[2]!.click();
    fixture.detectChanges();
    expect(picked).toEqual(['all']);
  });
});

describe('CountrySelect', () => {
  it('stays hidden until profiles give countries', () => {
    const fixture = TestBed.createComponent(CountrySelect);
    fixture.componentRef.setInput('countries', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="combobox"]')).toBeNull();

    fixture.componentRef.setInput('countries', [{ code: 'TR', count: 3, top: [] }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="combobox"]')?.getAttribute('aria-label')).toBe('Filter by country');
  });

  it('keeps showing a picked country with nobody in this period', () => {
    const fixture = TestBed.createComponent(CountrySelect);
    fixture.componentRef.setInput('countries', []);
    fixture.componentRef.setInput('value', 'BG');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Bulgaria');
  });

  it('filters the countries by name and emits the pick', async () => {
    const scrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = () => undefined;
    onTestFinished(() => {
      Element.prototype.scrollIntoView = scrollIntoView;
    });
    const fixture = TestBed.createComponent(CountrySelect);
    fixture.componentRef.setInput('countries', [{ code: 'TR', count: 3, top: [] }, { code: 'BG', count: 1, top: [] }]);
    fixture.detectChanges();
    const picked: Array<string | null> = [];
    fixture.componentInstance.valueChange.subscribe(value => picked.push(value));

    fixture.nativeElement.querySelector('[role="combobox"]').click();
    await fixture.whenStable();
    const input = document.querySelector('input[aria-label="Search a country"]') as HTMLInputElement;
    input.value = 'bulg';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();

    const visible = () => [...document.querySelectorAll<HTMLElement>('[role="option"]:not([data-hidden])')];
    expect(visible().map(option => option.getAttribute('data-value'))).toEqual(['BG']);
    visible()[0]!.click();
    expect(picked).toEqual(['BG']);
  });

  it('highlights the selected country when it opens', async () => {
    const scrollIntoView = Element.prototype.scrollIntoView;
    const scrolled: Element[] = [];
    Element.prototype.scrollIntoView = function () { scrolled.push(this); };
    onTestFinished(() => {
      Element.prototype.scrollIntoView = scrollIntoView;
    });
    const fixture = TestBed.createComponent(CountrySelect);
    fixture.componentRef.setInput('countries', [{ code: 'TR', count: 3, top: [] }, { code: 'BG', count: 1, top: [] }]);
    fixture.componentRef.setInput('value', 'BG');
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[role="combobox"]').click();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    const bulgaria = document.querySelector('[role="option"][data-value="BG"]')!;
    expect(bulgaria.hasAttribute('data-highlighted')).toBe(true);
    expect(scrolled).toContain(bulgaria);
  });
});

describe('matchesCountry', () => {
  it.each([
    ['TR', 'turkey'],
    ['TR', 'Türkiye'],
    ['TR', 'turkiye'],
    ['TR', 'TÜRKİYE'],
    ['TR', 'türkıye'],
    ['US', 'usa'],
    ['GB', 'uk'],
    ['DE', 'deutsch'],
  ])('%s matches %s', (code, search) => expect(matchesCountry(code, search)).toBe(true));

  it('does not match another country', () => {
    expect(matchesCountry('DE', 'türkiye')).toBe(false);
    expect(matchesCountry('ZZ', 'usa')).toBe(false);
  });
});

describe('LeaderboardGrid', () => {
  it('names a contributor by full name and username, once when they are the same', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(LeaderboardGrid);
    fixture.componentRef.setInput('page', {
      period: 'all', country: null, periods: ['all'], total: 3, landedPullRequests: 0, issues: 0, comments: 0, reviewComments: 0, collectedAt: null,
      items: [
        { githubId: 1, username: 'mhevery', name: 'Miško Hevery', rank: 1, score: 9761 },
        { githubId: 2, username: 'crisbeto', name: 'CRISBETO', rank: 2, score: 5 },
        { githubId: 3, username: 'atscott', rank: 3, score: 1 },
      ],
    });
    fixture.detectChanges();
    const labels = [...fixture.nativeElement.querySelectorAll('ol a')].map((link: Element) => link.getAttribute('aria-label'));
    expect(labels).toEqual(['Miško Hevery (mhevery), #1, 9,761 pts', 'crisbeto, #2, 5 pts', 'atscott, #3, 1 pt']);
  });
});

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

describe('untilNextCollection', () => {
  it.each([
    ['2026-11-05T00:00:00Z', '3h 17m'],
    ['2026-11-05T03:00:00Z', '17m'],
    ['2026-11-05T03:16:30Z', 'under a minute'],
    ['2026-11-05T03:17:00Z', '24h 0m'],
    ['2026-11-05T22:17:00Z', '5h 0m'],
    ['2026-12-31T23:00:00Z', '4h 17m'],
  ])('at %s: %s', (now, expected) => expect(untilNextCollection(new Date(now))).toBe(expected));
});
