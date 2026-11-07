import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LeaderboardGrid } from './leaderboard-grid';

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
