import type { LeaderboardPage } from '@angularians/shared';
import { SITE_DESCRIPTION, SITE_TITLE } from '../site';
import { boardHead } from './board-head';

const page = { period: '2025', country: 'TR', total: 12, landedPullRequests: 3, issues: 1, comments: 2, reviewComments: 0 } as LeaderboardPage;

describe('boardHead', () => {
  it('keeps the site title and description for the plain page', () => {
    expect(boardHead(page, null, null)).toEqual({ title: SITE_TITLE, description: SITE_DESCRIPTION });
  });

  it('names a country board and a shared period', () => {
    expect(boardHead(page, null, 'TR').title).toBe('Top Angularians in Turkey · Angular contributors');
    expect(boardHead(page, '2025', 'TR').title).toBe('Top Angularians in Turkey in 2025');
  });
});
