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
import { GITHUB_TEXT } from './github-colors'
import { HELPFUL_COMMENT_REACTIONS, HELPFUL_ISSUE_COMMENTS, HELPFUL_ISSUE_REACTIONS } from '@angularians/shared'

const CARD = 'flex w-full flex-col rounded-xl bg-muted/40 p-6 ring-1 ring-border sm:p-8'
/**
 * The signed-in card's size, from the width of its container (it wraps below 520px), for it and for its skeleton:
 * the hero does not move when the stats arrive. Needs an `@container` parent. Signed out, the card is only as tall
 * as its content: most visitors are, and a visitor signed in last time gets the skeleton at this size instead.
 */
const SIGNED_IN = 'min-h-[25rem] @min-[400px]:min-h-[23rem] @min-[520px]:min-h-[22rem]'
/** Signed out: as tall as the hero's text on wide screens, so the card does not look lost beside it. */
const SIGNED_OUT = 'sm:min-h-64 lg:min-h-80'
/** Phones, signed out: only the sign-in button, as a third button under the hero's two (the hero's gap, closed up). */
const SIGN_IN_ONLY = 'max-sm:-mt-[1.375rem] max-sm:bg-transparent max-sm:p-0 max-sm:ring-0'

/** `Apr 2025`, as on the profile and the card. */
const SINCE = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })

/** The signed-in Angularian, or a sign-in. */
@Component({
  selector: 'app-me-card',
  imports: [AngularLogo, HlmButton, HlmSkeleton, HlmTooltip, JoinLinks, AngularianPill, NgIcon, RouterLink, ScoreDialog, Share],
  providers: [provideIcons({ vikingHead, remixMedalLine, octIssueOpened, octGitMerge, remixInformationLine, remixChatHeartLine, simpleGithub })],
  host: { class: 'block w-full' },
  templateUrl: './me-card.html',
})
export class MeCard {
  protected readonly auth = inject(AuthService)
  protected readonly card = CARD
  protected readonly signedIn = SIGNED_IN
  protected readonly signedOut = SIGNED_OUT
  protected readonly signInOnly = SIGN_IN_ONLY
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
      { label: 'Merged PRs', one: 'Merged PR', value: person?.pullRequests.all ?? 0, hint: null, icon: 'octGitMerge', color: GITHUB_TEXT.purple },
      { label: 'Helpful issues', one: 'Helpful issue', value: person?.helpfulIssues ?? 0, hint: `Completed, or ${HELPFUL_ISSUE_REACTIONS}+ reactions, or ${HELPFUL_ISSUE_COMMENTS}+ comments`, icon: 'octIssueOpened', color: GITHUB_TEXT.green },
      { label: 'Helpful comments', one: 'Helpful comment', value: person?.helpfulComments ?? 0, hint: `${HELPFUL_COMMENT_REACTIONS}+ reactions, or a discussion's accepted answer`, icon: 'remixChatHeartLine', color: GITHUB_TEXT.blue },
    ]
  })

  protected readonly avatar = (githubId: number) => avatarUrl(githubId, 64)
  protected readonly number = formatNumber
  protected readonly points = formatPoints
}
