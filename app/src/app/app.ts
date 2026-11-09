import { isPlatformBrowser, Location } from '@angular/common';
import { afterNextRender, Component, DestroyRef, inject, Injector, PLATFORM_ID, signal } from '@angular/core';
import { NavigationEnd, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { AngieIntro } from './layout/angie-intro';
import { HammerStrike } from './layout/hammer-strike';
import { SiteFooter } from './layout/site-footer';
import { SiteHeader } from './layout/site-header';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-root',
  imports: [AngieIntro, HammerStrike, RouterOutlet, SiteFooter, SiteHeader],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  // Created with the app, so a saved light theme applies from the start.
  private readonly theme = inject(ThemeService)

  /** `<base href="/">` would send a plain `#main` link to the home page, before hydration too. */
  protected readonly skipHref = signal(`${inject(Location).path()}#main`)

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) this.followNavigation(inject(Router), inject(Injector), inject(DestroyRef))
  }

  protected skipToMain(event: Event): void {
    event.preventDefault()
    document.getElementById('main')?.focus()
  }

  /**
   * A new page starts at the top. Only when the page itself changes: a period or a country on the same page
   * (query parameters) keeps the place, and back and forward keep the browser's own.
   */
  private followNavigation(router: Router, injector: Injector, destroyRef: DestroyRef): void {
    let path = location.pathname
    let section: string | null = null
    let back = false
    const subscription = router.events.subscribe(event => {
      if (event instanceof NavigationStart) back = event.navigationTrigger === 'popstate'
      if (event instanceof NavigationEnd) {
        const next = event.urlAfterRedirects.split(/[?#]/)[0]!
        if (next !== path && !back && !location.hash) window.scrollTo({ top: 0 })
        this.skipHref.set(`${event.urlAfterRedirects.split('#')[0]}#main`)
        // A new page or section: keyboard and screen reader users carry on from its start.
        const fragment = router.parseUrl(event.urlAfterRedirects).fragment
        const newPage = next !== path
        if (newPage || (fragment && fragment !== section)) {
          afterNextRender(() => {
            const target = fragment ? document.getElementById(fragment) : null
            if (target) target.focus()
            else if (newPage) document.getElementById('main')?.focus({ preventScroll: true })
          }, { injector })
        }
        path = next
        section = fragment
      }
    })
    destroyRef.onDestroy(() => subscription.unsubscribe())
  }
}
