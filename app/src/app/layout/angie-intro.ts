import { Component, computed, effect, inject, linkedSignal, signal } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { remixCheckLine, remixHeartLine, remixStarLine } from '@ng-icons/remixicon'
import { HlmButton } from '@spartan-ng/helm/button'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'
import { REPO_URL, SITE_AUTHOR, SPONSOR_URL } from '../site'
import { AngieService } from './angie.service'
import { AngularLogo } from './angular-logo'

const CLOSE_BUTTON_DELAY = 5000
const PRESS_KIT_URL = 'https://angular.dev/press-kit'

@Component({
  selector: 'app-angie-intro',
  imports: [AngularLogo, HlmButton, HlmDialogImports, NgIcon],
  providers: [provideIcons({ remixCheckLine, remixHeartLine, remixStarLine })],
  templateUrl: './angie-intro.html',
  styleUrl: './angie-intro.css',
})
export class AngieIntro {
  private readonly angie = inject(AngieService)
  protected readonly state = computed(() => (this.angie.introOpen() ? 'open' : 'closed'))
  protected readonly canClose = linkedSignal({ source: this.angie.introOpen, computation: () => false })
  protected readonly starred = signal(false)
  protected readonly starLabel = computed(() => (this.starred() ? 'Thanks for the star' : 'Star on GitHub'))
  protected readonly starIcon = computed(() => (this.starred() ? 'remixCheckLine' : 'remixStarLine'))
  protected readonly authorUrl = SITE_AUTHOR.url
  protected readonly pressKitUrl = PRESS_KIT_URL
  protected readonly repoUrl = REPO_URL
  protected readonly sponsorUrl = SPONSOR_URL

  constructor() {
    this.revealCloseButtonLater()
  }

  protected closeWhenDismissed(state: string): void {
    if (state === 'closed') this.angie.closeIntro()
  }

  protected markStarred(): void {
    this.starred.set(true)
  }

  protected turnOff(): void {
    this.angie.turnOff()
  }

  private revealCloseButtonLater(): void {
    effect((onCleanup) => {
      if (!this.angie.introOpen()) return
      const timer = setTimeout(() => this.canClose.set(true), CLOSE_BUTTON_DELAY)
      onCleanup(() => clearTimeout(timer))
    })
  }
}
