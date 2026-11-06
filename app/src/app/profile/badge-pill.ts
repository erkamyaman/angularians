import { NgTemplateOutlet } from '@angular/common'
import { Component, input } from '@angular/core'
import { NgIcon } from '@ng-icons/core'
import { HlmTooltip } from '@spartan-ng/helm/tooltip'
import { AngularLogo } from '../layout/angular-logo'
import type { EarnedBadge } from './earned-badges'

/** One badge: a link to its project, or a button that shows its tooltip. Its icons come from the page's `provideIcons`. */
@Component({
  selector: 'app-badge-pill',
  imports: [AngularLogo, HlmTooltip, NgIcon, NgTemplateOutlet],
  host: { class: 'contents' },
  templateUrl: './badge-pill.html',
})
export class BadgePill {
  readonly badge = input.required<EarnedBadge>()
  protected readonly pill = 'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium whitespace-nowrap ring-1 transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
}
