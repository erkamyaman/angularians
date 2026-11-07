import { showsSignInPrompt } from './sign-in-prompt';

describe('showsSignInPrompt', () => {
  const someone = { githubId: 1, login: 'someone', angularian: null, badges: [] };

  it('is drawn by the server and kept for a visitor signed out', () => {
    expect(showsSignInPrompt(null, false)).toBe(true);
    expect(showsSignInPrompt({ enabled: true, user: null }, false)).toBe(true);
  });

  it('goes for a signed-in visitor, or a site without sign-in', () => {
    expect(showsSignInPrompt({ enabled: true, user: someone }, false)).toBe(false);
    expect(showsSignInPrompt({ enabled: false, user: null }, false)).toBe(false);
  });

  it('is never drawn for a visitor signed in last time, even when the session has ended', () => {
    expect(showsSignInPrompt(null, true)).toBe(false);
    expect(showsSignInPrompt({ enabled: true, user: null }, true)).toBe(false);
    expect(showsSignInPrompt({ enabled: true, user: someone }, true)).toBe(false);
  });
});
