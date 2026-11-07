import { isPlatformBrowser } from '@angular/common'
import { afterNextRender, Component, DestroyRef, inject, PLATFORM_ID, signal } from '@angular/core'
import { lightning, type Strike } from './lightning'

/** The thunder follows the flash (`--strike` in the CSS), a quarter of a second later: the light arrives first. */
const THUNDER = 1400
const STORM = 4500
const HOVERED = 'angularians-storm-hovered'
const ANGIE = '/angie/angie-hammer.png'

/**
 * The word "Angularian(s)" or "ng-halla", or a click on the logo, calls Angie: she comes in with her hammer and calls down lightning somewhere on the page, with
 * thunder. A click on the word calls her any time; the mouse coming onto it does once a visit (the tab's session), and only
 * after a first click or key on the page, so the browser lets the thunder play. Never on touch screens, a link or button
 * that holds the word, or with reduced motion.
 */
@Component({
  selector: 'app-hammer-strike',
  host: { 'aria-hidden': 'true' },
  templateUrl: './hammer-strike.html',
  styleUrl: './hammer-strike.css',
})
export class HammerStrike {
  protected readonly strike = signal<Strike | null>(null)

  /** Angie has gone: the storm is over. */
  protected end(): void {
    this.strike.set(null)
  }

  constructor() {
    const destroyRef = inject(DestroyRef)
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return
    afterNextRender(() => {
      if (matchMedia('(prefers-reduced-motion: reduce), (hover: none)').matches) return
      let current: Element | null = null
      let thunderTimer: ReturnType<typeof setTimeout> | undefined
      let endTimer: ReturnType<typeof setTimeout> | undefined
      let thunder: HTMLAudioElement | undefined
      let strikes = 0
      let angie: HTMLImageElement | undefined
      let calling = false
      const call = () => {
        if (calling || this.strike()) return
        calling = true
        angie ??= Object.assign(new Image(), { src: ANGIE })
        angie.decode().then(storm, () => (angie = undefined)).finally(() => (calling = false))
      }
      const storm = () => {
        const x = innerWidth * (0.2 + Math.random() * 0.5)
        const y = innerHeight * (0.35 + Math.random() * 0.35)
        this.strike.set({ id: ++strikes, x, y, ...lightning(x, y, innerWidth, innerHeight) })
        clearTimeout(endTimer)
        endTimer = setTimeout(() => this.end(), STORM)
        rememberHover()
        thunderTimer = setTimeout(() => {
          if (!thunder) return
          thunder.currentTime = 0
          thunder.play().catch(() => {
            // Not allowed yet: no click or key on the page so far.
          })
        }, THUNDER)
      }
      // The first click or key wakes the hover up, and loads the thunder ahead of the first storm.
      const wake = () => {
        if (thunder) return
        thunder = new Audio('/sounds/thunder.mp3')
        thunder.preload = 'auto'
        thunder.volume = 0.6
      }
      const onOver = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return
        const word = angularian(event.target)
        // Once per entry into a word: moving inside it, or over its letters, does not call her again.
        if (word === current) return
        current = word
        if (word && thunder && !hoveredThisVisit()) call()
      }
      const onClick = (event: MouseEvent) => {
        if ((event as PointerEvent).pointerType === 'touch' || this.strike()) return
        if (angularian(event.target) || headerLogo(event.target)) call()
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
}

/** The word "Angularian(s)" or "ng-halla" under the pointer, not in a link or a button, or `null`. Ranks and headings share its font. */
function angularian(target: EventTarget | null): Element | null {
  const element = target as Element | null
  const word = element?.closest?.('.brand')
  if (!word || word.closest('a, button')) return null
  return [element!, word].find(candidate => /^(angularians?|ng-halla)$/i.test(candidate.textContent?.trim() ?? '')) ?? null
}

function headerLogo(target: EventTarget | null): boolean {
  return !!(target as Element | null)?.closest?.('a.logo-link')
}

function hoveredThisVisit(): boolean {
  try {
    return sessionStorage.getItem(HOVERED) === '1'
  }
  catch {
    return false
  }
}

function rememberHover(): void {
  try {
    sessionStorage.setItem(HOVERED, '1')
  }
  catch {
    // Storage blocked: hovering may call her again.
  }
}
