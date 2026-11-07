import { DOCUMENT, isPlatformBrowser } from '@angular/common'
import { injectRequest } from '@analogjs/router/tokens'
import { inject, PLATFORM_ID, signal, Service } from '@angular/core'
import type { SignedIn } from '../../server/auth/session'
import { hasSignedInHint } from './hint'

/**
 * Who is signed in, asked in the browser only: pages are cached for everyone, so they never carry it.
 * `null` until known (and on the server).
 */
@Service()
export class AuthService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))
  private readonly document = inject(DOCUMENT)
  private readonly request = injectRequest()

  readonly state = signal<SignedIn | null>(null)
  /**
   * Signed in last time (the hint cookie, `hint.ts`): the server and the browser both read it, so the first paint is
   * already the signed-in card's skeleton and the avatar's place, not the signed-out card.
   */
  readonly wasSignedIn = signal(false)

  constructor() {
    this.readSignedInHint()
    if (this.browser) this.loadState()
  }

  /** Sign in, then come back to this path. */
  loginUrl(returnTo: string): string {
    return `/api/auth/login?${new URLSearchParams({ returnTo })}`
  }

  /** The hint cookie, from the page in the browser and from the request on the server. */
  private readSignedInHint(): void {
    this.wasSignedIn.set(hasSignedInHint(this.browser ? this.document.cookie : this.request?.headers.cookie))
  }

  private loadState(): void {
    fetch('/api/auth/me', { credentials: 'same-origin', headers: { accept: 'application/json' } })
      .then(response => (response.ok ? response.json() as Promise<SignedIn> : { enabled: false, user: null }))
      .then(state => this.state.set(state), () => this.state.set({ enabled: false, user: null }))
  }
}
