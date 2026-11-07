import { avatarUrl } from './avatar-url';

describe('avatarUrl', () => {
  it('links avatars by GitHub id at 2x', () => {
    expect(avatarUrl(4450522, 112)).toBe('https://avatars.githubusercontent.com/u/4450522?s=224&v=4');
  });
});
