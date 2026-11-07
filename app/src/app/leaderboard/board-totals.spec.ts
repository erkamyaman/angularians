import { boardTotals } from './board-totals';

describe('board totals', () => {
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
});
