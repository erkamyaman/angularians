import { statWord } from './stat-names';

describe('stat names', () => {
  it('names a stat for its count, without the count', () => {
    expect(statWord('pullRequests', 1)).toBe('Merged PR');
    expect(statWord('reactions', 0)).toBe('Reactions');
  });
});
