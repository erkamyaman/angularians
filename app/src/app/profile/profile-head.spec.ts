import type { ContributorPeriodStats, ContributorProfile } from '@angularians/shared';
import { profileHead } from './profile-head';

describe('profileHead', () => {
  const stats = { rank: 12, score: 300, pullRequests: { all: 4 }, issues: 1, comments: 2, reviewComments: 1 } as ContributorPeriodStats;
  it('names the person, the rank and what they did in the period', () => {
    expect(profileHead({ username: 'crisbeto', name: 'Kristiyan Kostadinov' } as ContributorProfile, stats, '2025')).toEqual({
      title: 'Kristiyan Kostadinov: #12 in 2025',
      description: 'Kristiyan Kostadinov (@crisbeto) contributed to Angular in 2025: 4 merged pull requests, 1 issue and 3 comments. Ranked #12 with 300 pts.',
    });
    expect(profileHead({ username: 'crisbeto', name: null } as unknown as ContributorProfile, stats, 'all').title).toBe('crisbeto, Angularian #12');
  });
});
