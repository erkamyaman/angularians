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
import { Share, SHARE_BUTTONS } from '../profile/share'
import { avatarUrl } from '../contributors/avatar-url'
import { formatNumber, formatPoints, formatRank } from '../text/number-format'
import { pluralWord } from '../text/plural'
import { STAT_NAMES } from '../text/stat-names'
import type { GithubColor } from './github-color'
import { HELPFUL_COMMENT_REACTIONS, HELPFUL_ISSUE_COMMENTS, HELPFUL_ISSUE_REACTIONS } from '@angularians/shared'

/** The signed-in Angularian, or a sign-in. */
@Component({
  selector: 'app-me-card',
  imports: [AngularLogo, ContributorSince, HlmButton, HlmSkeleton, HlmTooltip, JoinLinks, AngularianPill, NgIcon, NgTemplateOutlet, RouterLink, ScoreDialog, Share],
  providers: [provideIcons({ vikingHead, remixMedalLine, octIssueOpened, octGitMerge, remixInformationLine, remixChatHeartLine, simpleGithub })],
  templateUrl: './me-card.html',
  styleUrl: './me-card.css',
})
export class MeCard {
  private readonly auth = inject(AuthService)
  protected readonly state = this.auth.state
  protected readonly me = computed(() => this.state()?.user ?? null)
  /** Signed in last time, and the session not known yet: the signed-in card's skeleton. */
  protected readonly restoringSession = computed(() => this.state() === null && this.auth.wasSignedIn())
  /** Signed in last time, not any more (the session ended): the sign-in, in the skeleton's place. */
  protected readonly sessionEnded = computed(() => this.state() !== null && !this.me() && this.auth.wasSignedIn())
  protected readonly signInEnabled = computed(() => this.state()?.enabled !== false)
  /** Phones, signed out: the sign-in button alone, under the hero's buttons (not in the skeleton's place). */
  protected readonly signInOnly = computed(() => this.signInEnabled() && !this.sessionEnded())
  protected readonly loginUrl = this.auth.loginUrl('/')
  protected readonly lastYear = computed(() => this.me()?.angularian?.periods.find(row => row.period === '12m') ?? null)
  protected readonly periods = computed(() => this.me()?.angularian?.periods.map(row => row.period) ?? [])
  protected readonly unlocks = computed(() => {
    const person = this.me()?.angularian
    return [
      { one: STAT_NAMES.pullRequests[0], label: STAT_NAMES.pullRequests[1], value: person?.pullRequests.all ?? 0, hint: null, icon: 'octGitMerge', color: 'purple' },
      { label: 'Helpful issues', one: 'Helpful issue', value: person?.helpfulIssues ?? 0, hint: `Completed, or ${HELPFUL_ISSUE_REACTIONS}+ reactions, or ${HELPFUL_ISSUE_COMMENTS}+ comments`, icon: 'octIssueOpened', color: 'green' },
      { label: 'Helpful comments', one: 'Helpful comment', value: person?.helpfulComments ?? 0, hint: `${HELPFUL_COMMENT_REACTIONS}+ reactions, or a discussion's accepted answer`, icon: 'remixChatHeartLine', color: 'blue' },
    ] satisfies readonly { color: GithubColor, [key: string]: unknown }[]
  })

  /** The labels of app-share's buttons, for the skeleton's. */
  protected readonly shareLabels = Object.values(SHARE_BUTTONS)
  protected readonly avatar = (githubId: number) => avatarUrl(githubId, 64)
  protected readonly number = formatNumber
  protected readonly points = formatPoints
  protected readonly rank = formatRank
  protected readonly word = pluralWord
}
