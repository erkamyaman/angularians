import { DOCUMENT, isPlatformBrowser } from '@angular/common'
import { effect, inject, PLATFORM_ID, Service, signal } from '@angular/core'

export const ANGIE_OFF_KEY = 'angularians-angie-off'
export const ANGIE_MET_KEY = 'angularians-angie-met'

@Service()
export class AngieService {
  private readonly document = inject(DOCUMENT)
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))

  private met = false

  readonly on = signal(true)
  readonly introOpen = signal(false)

  constructor() {
    if (!this.browser) return
    this.restoreChoice()
    this.markPage()
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

  stormEnded(): void {
    if (!this.on() || this.met) return
    this.met = true
    this.introOpen.set(true)
    try {
      localStorage.setItem(ANGIE_MET_KEY, '1')
    }
    catch {
      // Not remembered: she introduces herself again next visit.
    }
  }

  turnOff(): void {
    if (this.on()) this.toggle()
    this.closeIntro()
  }

  closeIntro(): void {
    this.introOpen.set(false)
  }

  private restoreChoice(): void {
    try {
      this.met = localStorage.getItem(ANGIE_MET_KEY) === '1'
      if (localStorage.getItem(ANGIE_OFF_KEY) === '1') this.on.set(false)
    }
    catch {
      // Storage can be blocked: on, the default.
    }
  }

  private markPage(): void {
    effect(() => this.document.documentElement.classList.toggle('angie-off', !this.on()))
  }
}
