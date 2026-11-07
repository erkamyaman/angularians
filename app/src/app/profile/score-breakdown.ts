// Ported from nuxt.com `app/components/nuxters/NuxtersScoreBreakdown.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
// Inline instead of a modal, and no core bonus.
import { Component, computed, input } from '@angular/core'
import { scoreBreakdown, type ScoredStats } from '@angularians/shared'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { remixBookOpenLine, remixBrushLine, remixChatHeartLine, remixFileCodeLine, remixLightbulbLine, remixRocketLine, remixToolsLine } from '@ng-icons/remixicon'
import { octComment, octIssueOpened, octShield, octSmiley } from '@ng-icons/octicons'
import { HlmProgressImports } from '@spartan-ng/helm/progress'
import { formatNumber, formatPoints } from '../text/number-format'

/** `scoreBreakdown`'s icon keys, and the icons they show. */
const ICONS: Record<string, string> = {
  'rocket': 'remixRocketLine',
  'wrench': 'remixToolsLine',
  'book-open': 'remixBookOpenLine',
  'brush-cleaning': 'remixBrushLine',
  'lightbulb': 'remixLightbulbLine',
  'message-circle-heart': 'remixChatHeartLine',
  'circle-dot': 'octIssueOpened',
  'file-code': 'remixFileCodeLine',
  'message-circle': 'octComment',
  'smile-plus': 'octSmiley',
  'shield': 'octShield',
}

/** One row per contribution type: count × points = total, with a bar on one scale so the rows compare. */
@Component({
  selector: 'app-score-breakdown',
  imports: [HlmProgressImports, NgIcon],
  providers: [provideIcons({
    remixBookOpenLine, remixBrushLine, octIssueOpened, remixFileCodeLine, remixLightbulbLine, octComment, remixChatHeartLine,
    remixRocketLine, octShield, octSmiley, remixToolsLine,
  })],
  templateUrl: './score-breakdown.html',
})
export class ScoreBreakdown {
  readonly stats = input.required<ScoredStats>()

  protected readonly rows = computed(() => scoreBreakdown(this.stats()))
  protected readonly max = computed(() => Math.max(1, ...this.rows().map(row => row.total)))
  protected readonly icon = (name: string) => ICONS[name] ?? 'remixRocketLine'
  protected readonly number = formatNumber
  protected readonly points = formatPoints
}
