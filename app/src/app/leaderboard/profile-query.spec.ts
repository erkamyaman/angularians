import { profileQuery } from './profile-query';

describe('profileQuery', () => {
  it('links profiles to the board period', () => {
    expect(profileQuery('all')).toEqual({});
    expect(profileQuery('2019')).toEqual({ period: '2019' });
    expect(profileQuery('2019', 'DE')).toEqual({ period: '2019', country: 'DE' });
    expect(profileQuery('all', 'TR')).toEqual({ country: 'TR' });
  });
});
