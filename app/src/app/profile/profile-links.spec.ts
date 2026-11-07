import type { ContributorProfile } from '@angularians/shared';
import { profileLinks } from './profile-links';

describe('profileLinks', () => {
  it('keeps one link per URL, the GitHub profile first', () => {
    const person = {
      username: 'bob',
      website: 'https://www.bob.dev/',
      socialAccounts: [{ provider: 'generic', url: 'http://bob.dev', displayName: 'bob.dev' }, { provider: 'bluesky', url: 'https://bsky.app/profile/bob', displayName: '@bob' }],
    } as unknown as ContributorProfile;
    expect(profileLinks(person).map(link => [link.label, link.icon])).toEqual([
      ['github.com/bob', 'simpleGithub'],
      ['Website', 'remixLinkM'],
      ['@bob', 'simpleBluesky'],
    ]);
  });
});
