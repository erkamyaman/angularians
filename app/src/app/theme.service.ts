import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, PLATFORM_ID, signal, Service } from '@angular/core';

export type Theme = 'light' | 'dark';

/** Same key as the inline script in index.html, which applies the theme before the first paint. */
export const THEME_STORAGE_KEY = 'theme';

/**
 * Dark by default, light when chosen (and remembered), as the `dark` class on <html> (Spartan's dark variant).
 * The server renders dark (index.html has the class); the inline script switches to a saved light theme before paint.
 */
@Service()
export class ThemeService {
  private readonly document = inject(DOCUMENT)
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))

  readonly theme = signal<Theme>('dark')
  readonly dark = computed(() => this.theme() === 'dark')

  constructor() {
    if (!this.browser) return
    this.restoreSavedTheme()
    this.applyToPage()
  }

  toggle(): void {
    this.theme.set(this.dark() ? 'light' : 'dark')
    try {
      // Dark is the default: only a light choice needs remembering.
      if (this.dark()) localStorage.removeItem(THEME_STORAGE_KEY)
      else localStorage.setItem(THEME_STORAGE_KEY, 'light')
    }
    catch {
      // Not remembered, still applied.
    }
  }

  private restoreSavedTheme(): void {
    try {
      if (localStorage.getItem(THEME_STORAGE_KEY) === 'light') this.theme.set('light')
    }
    catch {
      // Storage can be blocked: dark, the default.
    }
  }

  /** The `dark` class and the color scheme of <html> follow the theme. */
  private applyToPage(): void {
    effect(() => {
      const root = this.document.documentElement
      root.classList.toggle('dark', this.dark())
      root.style.colorScheme = this.theme()
    })
  }
}
