import { Component } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { remixArrowRightUpLine } from '@ng-icons/remixicon'
import { HlmCardImports } from '@spartan-ng/helm/card'
import { RouterLink } from '@angular/router'
import { LogoMark } from '../layout/logo-mark'
import { avatarUrl } from './format'
import { BUILT_ON, type ProjectBadge } from '../profile/special-badges'
import { BadgePill } from '../profile/badge-pill'
import { projectBadge } from '../profile/earned-badges'

@Component({
  selector: 'app-earn-badges',
  imports: [BadgePill, LogoMark, HlmCardImports, NgIcon, RouterLink],
  providers: [provideIcons({ remixArrowRightUpLine })],
  host: { class: 'block' },
  templateUrl: './earn-badges.html',
})
export class EarnBadges {
  protected readonly projects = BUILT_ON
  private readonly badges = new Map(BUILT_ON.map(project => [project, projectBadge(project, project.people[0]!.role)]))
  protected readonly badge = (project: ProjectBadge) => this.badges.get(project)!
  protected readonly avatar = (githubId: number) => avatarUrl(githubId, 40)
}
