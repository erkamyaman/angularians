// Ported from nuxt.com `app/components/nuxters/NuxtersMeCard.vue` and `NuxtersMeCardSkeleton.vue`
// (MIT, Copyright (c) 2022-2023 NuxtLabs). No Discord: the actions are the share buttons.
import { Component, computed, inject } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'
import { RouterLink } from '@angular/router'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { remixChatHeartLine, remixInformationLine, remixMedalLine } from '@ng-icons/remixicon'
import { vikingHead } from '../layout/viking-icons'
import { octGitMerge, octIssueOpened } from '@ng-icons/octicons'
import { simpleGithub } from '@ng-icons/simple-icons'
import { HlmButton } from '@spartan-ng/helm/button'
import { HlmSkeleton } from '@spartan-ng/helm/skeleton'
import { HlmTooltip } from '@spartan-ng/helm/tooltip'
import { AuthService } from '../auth/auth.service'
import { AngularLogo } from '../layout/angular-logo'
import { AngularianPill } from '../layout/angularian-pill'
import { ContributorSince } from '../profile/contributor-since'
import { ScoreDialog } from '../profile/score-dialog'
import { JoinLinks } from './join-links'
import { Share } from '../profile/share'
import { avatarUrl } from './avatar-url'
import { formatNumber, formatPoints } from './number-format'

/** The signed-in Angularian, or a sign-in. */
@Component({
  selector: 'app-me-card',
  imports: [AngularLogo, ContributorSince, HlmButton, HlmSkeleton, HlmTooltip, JoinLinks, AngularianPill, NgIcon, NgTemplateOutlet, RouterLink, ScoreDialog, Share],
  providers: [provideIcons({ vikingHead, remixMedalLine, octIssueOpened, octGitMerge, remixInformationLine, remixChatHeartLine, simpleGithub })],
  templateUrl: './me-card.html',
  styleUrl: './me-card.css',
})
export class MeCard {
  protected readonly auth = inject(AuthService)
  protected readonly state = this.auth.state
  protected readonly me = computed(() => this.state()?.user ?? null)
  protected readonly loginUrl = this.auth.loginUrl('/')
  protected readonly lastYear = computed(() => this.me()?.angularian?.periods.find(row => row.period === '12m') ?? null)
  protected readonly periods = computed(() => this.me()?.angularian?.periods.map(row => row.period) ?? [])
  protected readonly unlocks = computed(() => {
    const person = this.me()?.angularian
    return [
      { label: 'Merged PRs', one: 'Merged PR', value: person?.pullRequests.all ?? 0, hint: null, icon: 'octGitMerge', color: 'purple' },
      { label: 'Helpful issues', one: 'Helpful issue', value: person?.helpfulIssues ?? 0, hint: 'Completed, or 3+ reactions, or 5+ comments', icon: 'octIssueOpened', color: 'green' },
      { label: 'Helpful comments', one: 'Helpful comment', value: person?.helpfulComments ?? 0, hint: '3+ reactions, or a discussion\'s accepted answer', icon: 'remixChatHeartLine', color: 'blue' },
    ]
  })

  /** The labels of app-share's buttons, for the skeleton's. */
  protected readonly shareLabels = ['Copy profile link', 'Share card', 'Add to README']
  protected readonly avatar = (githubId: number) => avatarUrl(githubId, 64)
  protected readonly number = formatNumber
  protected readonly points = formatPoints
}
