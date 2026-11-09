import { isPlatformBrowser } from '@angular/common'
import { inject, PLATFORM_ID, Service, signal } from '@angular/core'

export const ANGIE_OFF_KEY = 'angularians-angie-off'

@Service()
export class AngieService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))

  readonly on = signal(true)

  constructor() {
    if (this.browser) this.restoreChoice()
  }

  toggle(): void {
    this.on.update(on => !on)
    try {
      if (this.on()) localStorage.removeItem(ANGIE_OFF_KEY)
      else localStorage.setItem(ANGIE_OFF_KEY, '1')
    }
    catch {
      // Not remembered, still applied.
    }
  }

  private restoreChoice(): void {
    try {
      if (localStorage.getItem(ANGIE_OFF_KEY) === '1') this.on.set(false)
    }
    catch {
      // Storage can be blocked: on, the default.
    }
  }
}
