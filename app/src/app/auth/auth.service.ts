import { DOCUMENT, isPlatformBrowser } from '@angular/common'
import { injectRequest } from '@analogjs/router/tokens'
import { afterNextRender, inject, InjectionToken, makeStateKey, PLATFORM_ID, signal, Service, TransferState } from '@angular/core'
import type { SignedIn } from '../../server/auth/session'
import { hasSignedInHint } from './hint'

export const SIGN_IN_SET_UP = new InjectionToken<boolean>('SIGN_IN_SET_UP')
const SIGN_IN_OFF = makeStateKey<boolean>('sign-in-off')

/**
 * Who is signed in, asked in the browser only: pages are cached for everyone, so they never carry it.
 * `null` until known (and on the server), except on a site without sign-in: `{ enabled: false }` from the first paint.
 */
@Service()
export class AuthService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))
  private readonly document = inject(DOCUMENT)
  private readonly request = injectRequest()
  private readonly transferState = inject(TransferState)
  private readonly setUp = inject(SIGN_IN_SET_UP, { optional: true })

  readonly state = signal<SignedIn | null>(null)
  /**
   * Signed in last time (the hint cookie, `hint.ts`): the server and the browser both read it, so the first paint is
   * already the signed-in card's skeleton and the avatar's place, not the signed-out card.
   */
  readonly wasSignedIn = signal(false)

  constructor() {
    this.readSignedInHint()
    if (this.signInOff()) this.state.set({ enabled: false, user: null })
    else if (this.browser && this.wasSignedIn()) this.loadState()
    else if (this.browser) this.showSignedOut()
  }

  /** Sign in, then come back to this path. */
  loginUrl(returnTo: string): string {
    return `/api/auth/login?${new URLSearchParams({ returnTo })}`
  }

  /** The hint cookie, from the page in the browser and from the request on the server. */
  private readSignedInHint(): void {
    this.wasSignedIn.set(hasSignedInHint(this.browser ? this.document.cookie : this.request?.headers.cookie))
  }

  private signInOff(): boolean {
    if (this.browser) return this.transferState.get(SIGN_IN_OFF, false)
    const off = this.setUp === false
    this.transferState.set(SIGN_IN_OFF, off)
    return off
  }

  /**
   * No hint, no session to ask about: each check is a call to the server function that no cache can answer, and most
   * visitors are signed out. After the first render, which must match the server's.
   */
  private showSignedOut(): void {
    afterNextRender(() => this.state.set({ enabled: true, user: null }))
  }

  /**
   * A check that fails (offline, a server error) counts as signed out with sign-in on, the page as the server drew it:
   * nothing is taken away from under the visitor, and the sign-in is there to try again. Only the site itself says
   * sign-in is off (`enabled: false`).
   */
  private loadState(): void {
    const signedOut: SignedIn = { enabled: true, user: null }
    fetch('/api/auth/me', { credentials: 'same-origin', headers: { accept: 'application/json' } })
      .then(response => (response.ok ? response.json() as Promise<SignedIn> : signedOut))
      .then(state => this.state.set(state), () => this.state.set(signedOut))
  }
}
