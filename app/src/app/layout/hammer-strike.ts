import { isPlatformBrowser } from '@angular/common'
import { afterNextRender, Component, DestroyRef, effect, inject, PLATFORM_ID, signal } from '@angular/core'
import { AngieService } from './angie.service'
import { lightning, type Strike } from './lightning'

/** The thunder follows the flash (`--strike` in the CSS), a quarter of a second later: the light arrives first. */
const THUNDER = 1400
const STORM = 4500
const HOVERED = 'angularians-storm-hovered'
const LOGO = 'angularians-storm-logo'
const ANGIE = '/angie/angie-hammer.png'

/**
 * The word "Angularian(s)" or "ng-halla", or a logo, calls Angie: she comes in with her hammer and calls down lightning
 * somewhere on the page, with thunder. A click on the word calls her any time, a click on a logo once a visit (the tab's
 * session); the mouse coming onto the word does once a visit too, and only after a first click or key on the page, so
 * the browser lets the thunder play. Never on touch screens, a link, button or dialog that holds the word (a link
 * can opt in with `data-calls-angie`), with reduced motion, or once the visitor has turned her off in the account menu.
 */
@Component({
  selector: 'app-hammer-strike',
  host: { 'aria-hidden': 'true' },
  templateUrl: './hammer-strike.html',
  styleUrl: './hammer-strike.css',
})
export class HammerStrike {
  private readonly angie = inject(AngieService)
  protected readonly strike = signal<Strike | null>(null)
  private thunder: HTMLAudioElement | undefined

  /** Angie has gone: the storm is over. */
  protected end(): void {
    if (!this.strike()) return
    this.strike.set(null)
    this.angie.stormEnded()
  }

  constructor() {
    const destroyRef = inject(DestroyRef)
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return
    this.stopWhenTurnedOff()
    afterNextRender(() => {
      if (matchMedia('(prefers-reduced-motion: reduce), (hover: none)').matches) return
      let current: Element | null = null
      let thunderTimer: ReturnType<typeof setTimeout> | undefined
      let endTimer: ReturnType<typeof setTimeout> | undefined
      let strikes = 0
      let portrait: HTMLImageElement | undefined
      let calling = false
      const call = (started?: () => void) => {
        if (!this.angie.on() || calling || this.strike()) return
        calling = true
        portrait ??= Object.assign(new Image(), { src: ANGIE })
        portrait.decode().then(() => {
          if (!this.angie.on()) return
          storm()
          started?.()
        }, () => (portrait = undefined)).finally(() => (calling = false))
      }
      const storm = () => {
        const x = innerWidth * (0.2 + Math.random() * 0.5)
        const y = innerHeight * (0.35 + Math.random() * 0.35)
        this.strike.set({ id: ++strikes, x, y, ...lightning(x, y, innerWidth, innerHeight) })
        clearTimeout(endTimer)
        endTimer = setTimeout(() => this.end(), STORM)
        remember(HOVERED)
        thunderTimer = setTimeout(() => {
          if (!this.thunder || !this.angie.on()) return
          this.thunder.currentTime = 0
          this.thunder.play().catch(() => {
            // Not allowed yet: no click or key on the page so far.
          })
        }, THUNDER)
      }
      // The first click or key wakes the hover up, and loads the thunder ahead of the first storm.
      const wake = () => {
        if (this.thunder) return
        this.thunder = new Audio('/sounds/thunder.mp3')
        this.thunder.preload = 'auto'
        this.thunder.volume = 0.6
      }
      const onOver = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return
        const word = angularian(event.target)
        // Once per entry into a word: moving inside it, or over its letters, does not call her again.
        if (word === current) return
        current = word
        if (word && this.thunder && !usedThisVisit(HOVERED)) call()
      }
      const onClick = (event: MouseEvent) => {
        if ((event as PointerEvent).pointerType === 'touch' || this.strike()) return
        if (angularian(event.target) || (event.target as Element | null)?.closest?.('[data-calls-angie]')) call()
        else if (headerLogo(event.target) && !usedThisVisit(LOGO)) call(() => remember(LOGO))
      }
      document.addEventListener('pointerover', onOver)
      document.addEventListener('click', onClick)
      document.addEventListener('pointerdown', wake)
      document.addEventListener('keydown', wake)
      destroyRef.onDestroy(() => {
        document.removeEventListener('pointerover', onOver)
        document.removeEventListener('click', onClick)
        document.removeEventListener('pointerdown', wake)
        document.removeEventListener('keydown', wake)
        clearTimeout(thunderTimer)
        clearTimeout(endTimer)
      })
    })
  }

  private stopWhenTurnedOff(): void {
    effect(() => {
      if (this.angie.on()) return
      this.end()
      this.thunder?.pause()
    })
  }
}

/** The word "Angularian(s)" or "ng-halla" under the pointer, not in a link, a button or a dialog, or `null`. Ranks and headings share its font. */
function angularian(target: EventTarget | null): Element | null {
  const element = target as Element | null
  const word = element?.closest?.('.brand')
  if (!word || word.closest('a, button, hlm-dialog-content')) return null
  return [element!, word].find(candidate => /^(angularians?|ng-halla)$/i.test(candidate.textContent?.trim() ?? '')) ?? null
}

function headerLogo(target: EventTarget | null): boolean {
  return !!(target as Element | null)?.closest?.('a.logo-link')
}

function usedThisVisit(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === '1'
  }
  catch {
    return false
  }
}

function remember(key: string): void {
  try {
    sessionStorage.setItem(key, '1')
  }
  catch {
    // Storage blocked: it may call her again.
  }
}
