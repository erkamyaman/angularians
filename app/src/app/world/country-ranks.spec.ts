import { countryRanks } from './country-ranks';

describe('countryRanks', () => {
  it('gives countries with the same count the same rank', () => {
    const ranks = countryRanks([{ code: 'US', count: 4, top: [] }, { code: 'TR', count: 2, top: [] }, { code: 'DE', count: 2, top: [] }, { code: 'FR', count: 1, top: [] }]);
    expect([...ranks]).toEqual([['US', 1], ['TR', 2], ['DE', 2], ['FR', 4]]);
  });
});
