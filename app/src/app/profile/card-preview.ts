import { Component, computed, input } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { remixEyeLine } from '@ng-icons/remixicon'
import { simpleGithub } from '@ng-icons/simple-icons'
import { HlmButton } from '@spartan-ng/helm/button'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'
import { CARD_DESIGN } from './card-design'

/** The real card of a profile, for someone signed out: signing in is what unlocks sharing it. */
@Component({
  selector: 'app-card-preview',
  imports: [HlmButton, HlmDialogImports, NgIcon],
  providers: [provideIcons({ remixEyeLine, simpleGithub })],
  templateUrl: './card-preview.html',
  styleUrl: './card-preview.css',
})
export class CardPreview {
  readonly username = input.required<string>()
  readonly signInUrl = input.required<string>()
  protected readonly image = computed(() => `/${encodeURIComponent(this.username())}/card.png?v=${CARD_DESIGN}`)
}
