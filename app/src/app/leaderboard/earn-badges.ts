import { Component } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { remixArrowRightUpLine } from '@ng-icons/remixicon'
import { HlmCardImports } from '@spartan-ng/helm/card'
import { RouterLink } from '@angular/router'
import { LogoMark } from '../layout/logo-mark'
import { avatarUrl } from './format'
import { BUILT_ON, EMBLEMS } from '../profile/special-badges'

@Component({
  selector: 'app-earn-badges',
  imports: [LogoMark, HlmCardImports, NgIcon, RouterLink],
  providers: [provideIcons({ ...EMBLEMS, remixArrowRightUpLine })],
  host: { class: 'block' },
  templateUrl: './earn-badges.html',
})
export class EarnBadges {
  protected readonly projects = BUILT_ON
  protected readonly avatar = (githubId: number) => avatarUrl(githubId, 40)
}
