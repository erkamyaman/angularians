// Ported from nuxt.com `app/components/nuxters/NuxtersMeCard.vue` and `NuxtersMeCardSkeleton.vue`
// (MIT, Copyright (c) 2022-2023 NuxtLabs). No Discord: the actions are the share buttons.
import { Component, computed, inject } from '@angular/core'
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
import { ScoreDialog } from '../profile/score-dialog'
import { JoinLinks } from './join-links'
import { Share } from '../profile/share'
import { avatarUrl, formatNumber, formatPoints } from './format'
import type { GithubColor } from './github-color'
import { HELPFUL_COMMENT_REACTIONS, HELPFUL_ISSUE_COMMENTS, HELPFUL_ISSUE_REACTIONS } from '@angularians/shared'

/** `Apr 2025`, as on the profile and the card. */
const SINCE = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })

/** The signed-in Angularian, or a sign-in. */
@Component({
  selector: 'app-me-card',
  imports: [AngularLogo, HlmButton, HlmSkeleton, HlmTooltip, JoinLinks, AngularianPill, NgIcon, RouterLink, ScoreDialog, Share],
  providers: [provideIcons({ vikingHead, remixMedalLine, octIssueOpened, octGitMerge, remixInformationLine, remixChatHeartLine, simpleGithub })],
  templateUrl: './me-card.html',
  styleUrl: './me-card.css',
})
export class MeCard {
  protected readonly auth = inject(AuthService)
  protected readonly state = this.auth.state
  protected readonly me = computed(() => this.state()?.user ?? null)
  protected readonly loginUrl = this.auth.loginUrl('/')
  protected readonly contributorSince = computed(() => {
    const first = this.me()?.angularian?.firstContributionAt
    return first ? SINCE.format(new Date(first)) : null
  })
  protected readonly lastYear = computed(() => this.me()?.angularian?.periods.find(row => row.period === '12m') ?? null)
  protected readonly periods = computed(() => this.me()?.angularian?.periods.map(row => row.period) ?? [])
  protected readonly unlocks = computed(() => {
    const person = this.me()?.angularian
    return [
      { label: 'Merged PRs', one: 'Merged PR', value: person?.pullRequests.all ?? 0, hint: null, icon: 'octGitMerge', color: 'purple' },
      { label: 'Helpful issues', one: 'Helpful issue', value: person?.helpfulIssues ?? 0, hint: `Completed, or ${HELPFUL_ISSUE_REACTIONS}+ reactions, or ${HELPFUL_ISSUE_COMMENTS}+ comments`, icon: 'octIssueOpened', color: 'green' },
      { label: 'Helpful comments', one: 'Helpful comment', value: person?.helpfulComments ?? 0, hint: `${HELPFUL_COMMENT_REACTIONS}+ reactions, or a discussion's accepted answer`, icon: 'remixChatHeartLine', color: 'blue' },
    ] satisfies readonly { color: GithubColor, [key: string]: unknown }[]
  })

  protected readonly avatar = (githubId: number) => avatarUrl(githubId, 64)
  protected readonly number = formatNumber
  protected readonly points = formatPoints
}
