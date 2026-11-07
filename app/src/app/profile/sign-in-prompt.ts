import type { SignedIn } from '../../server/auth/session';

/**
 * Whether the profile asks "Is this your profile?". The page is cached for everyone, so the server draws it for the
 * visitors with no sign-in hint (most are signed out), and the browser keeps it unless the session says otherwise: a
 * user, or sign-in not set up on this site. A visitor signed in last time (the hint) gets the page without it, and
 * keeps it that way even if their session has ended, rather than have the page jump under them.
 */
export function showsSignInPrompt(state: SignedIn | null, wasSignedIn: boolean): boolean {
  if (wasSignedIn) return false;
  return state === null || (state.enabled && !state.user);
}
