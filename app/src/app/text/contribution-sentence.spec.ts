import { contributionSentence } from './contribution-sentence';

describe('contributionSentence', () => {
  it('counts the review comments with the comments', () => {
    expect(contributionSentence('1 person', { pullRequests: 1, issues: 2, comments: 3, reviewComments: 2 }, '2025'))
      .toBe('1 person contributed to Angular in 2025: 1 merged pull request, 2 issues and 5 comments.');
  });
});
