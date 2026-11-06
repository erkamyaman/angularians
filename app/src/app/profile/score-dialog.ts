// Ported from nuxt.com `app/components/nuxters/NuxtersScoreBreakdown.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs):
// the (i) button by a score, and the breakdown in a modal.
import { Component, input } from '@angular/core'
import type { ScoredStats } from '@angularians/shared'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { remixInformationLine } from '@ng-icons/remixicon'
import { HlmButton } from '@spartan-ng/helm/button'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'
import { formatNumber } from '../leaderboard/format'
import { ScoreBreakdown } from './score-breakdown'

@Component({
  selector: 'app-score-dialog',
  imports: [HlmButton, HlmDialogImports, NgIcon, ScoreBreakdown],
  providers: [provideIcons({ remixInformationLine })],
  templateUrl: './score-dialog.html',
  styleUrl: './score-dialog.css',
})
export class ScoreDialog {
  readonly stats = input.required<ScoredStats & { score: number }>()
  /** "of all time", "in 2025". */
  readonly phrase = input('of all time')
  protected readonly number = formatNumber
}
