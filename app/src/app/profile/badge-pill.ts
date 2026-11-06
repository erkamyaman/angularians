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
  templateUrl: './badge-pill.html',
  styleUrl: './badge-pill.css',
})
export class BadgePill {
  readonly badge = input.required<EarnedBadge>()
}
