// Ported from nuxt.com `app/components/nuxters/NuxtersShare.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
import { NgTemplateOutlet } from '@angular/common'
import { Component, computed, input, linkedSignal, signal } from '@angular/core'
import { periodPhrase, sortPeriods, type Period, COUNTRIES, countryName } from '@angularians/shared'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { remixCheckLine, remixDownloadLine, remixFileCopyLine, remixImageLine, remixLinkedinBoxFill, remixLinkM, remixMarkdownLine, remixShareLine } from '@ng-icons/remixicon'
import { simpleBluesky, simpleX } from '@ng-icons/simple-icons'
import { HlmButton } from '@spartan-ng/helm/button'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'
import { CountrySelect } from '../leaderboard/country-select'
import { PeriodTabs } from '../leaderboard/period-tabs'
import { HlmSkeleton } from '@spartan-ng/helm/skeleton'
import { SITE_URL } from '../site'
import { shareQuery } from './share-query'
import { CardBadgeOptions } from './card-badge-options'
import { badgeQuery, type BadgeNameStyle } from './card-badges'
import { CARD_DESIGN } from './card-design'
import type { EarnedBadge } from './earned-badges'

/** The skeleton shows at least this long, so a fast card does not flicker it. */
const MIN_LOADING_MS = 500

/** " in 2025" after a sentence about a period; nothing for all time. */
const periodSuffix = (period: Period) => (period === 'all' ? '' : ` ${periodPhrase(period)}`)

/** The share buttons' labels, in their order: the signed-in card's skeleton lays out the same buttons. */
export const SHARE_BUTTONS = { link: 'Copy profile link', card: 'Share card', readme: 'Add to README' } as const

/** Copy the profile link, or the Markdown of the Angularian card for a GitHub profile README. */
@Component({
  selector: 'app-share',
  imports: [CardBadgeOptions, CountrySelect, HlmButton, HlmDialogImports, HlmSkeleton, NgIcon, NgTemplateOutlet, PeriodTabs],
  providers: [provideIcons({ remixCheckLine, remixDownloadLine, remixFileCopyLine, remixImageLine, remixLinkedinBoxFill, remixShareLine, simpleBluesky, simpleX, remixLinkM, remixMarkdownLine })],
  templateUrl: './share.html',
  styleUrl: './share.css',
})
export class Share {
  readonly username = input.required<string>()
  /** The link and the card share the period on screen (all time by default). */
  readonly period = input<Period>('all')
  /** The periods the contributor is in: the README card can show any of them. */
  readonly periods = input<readonly Period[]>([])
  /** The country of the GitHub location, when it has one. */
  readonly country = input<string | null | undefined>(null)
  readonly badges = input<readonly EarnedBadge[]>([])

  protected readonly buttons = SHARE_BUTTONS
  protected readonly copied = signal<'link' | 'markdown' | null>(null)
  /** Each copy button says so for a moment after it copied. */
  protected readonly linkIcon = computed(() => (this.copied() === 'link' ? 'remixCheckLine' : 'remixLinkM'))
  protected readonly linkLabel = computed(() => (this.copied() === 'link' ? 'Link copied' : SHARE_BUTTONS.link))
  protected readonly markdownIcon = computed(() => (this.copied() === 'markdown' ? 'remixCheckLine' : 'remixFileCopyLine'))
  protected readonly markdownLabel = computed(() => (this.copied() === 'markdown' ? 'Markdown copied' : 'Copy Markdown'))
  /** The card renders on demand: its background and a loader meanwhile. */
  /** The card's four stat tiles, for the skeleton (`share.css` places each). */
  protected readonly tiles = [1, 2, 3, 4] as const
  protected readonly cardState = signal<'loading' | 'loaded' | 'error'>('loading')
  /** The last card that loaded: it stays under the next one while that renders. */
  protected readonly shownUrl = signal<string | null>(null)
  protected readonly cardPeriod = linkedSignal(() => this.period())
  /** A country picked for this card only. `null`: the GitHub location. */
  protected readonly flag = signal<string | null>(null)
  protected readonly hiddenBadges = signal<readonly string[]>([])
  protected readonly names = signal<BadgeNameStyle>('fun')
  protected readonly allCountries = Object.keys(COUNTRIES).map(code => ({ code, count: 0, top: [] }))
  protected readonly name = countryName
  protected readonly flagLabel = computed(() => {
    const country = this.country()
    return country ? `GitHub: ${countryName(country)}` : 'No flag'
  })
  protected readonly cardPeriods = computed(() => sortPeriods(['all', ...this.periods()]))

  private readonly badgeOptions = computed(() => badgeQuery({ hidden: this.hiddenBadges(), names: this.names() }))
  private readonly profileUrl = computed(() => `${SITE_URL}/${this.username()}${shareQuery(this.period())}`)
  /** The profile with the card's period and flag: what a post links to, and the README card's link. */
  private readonly cardProfileUrl = computed(() => `${SITE_URL}/${this.username()}${shareQuery(this.cardPeriod(), this.flag(), this.badgeOptions())}`)
  private readonly cardUrl = computed(() => `${SITE_URL}/${this.username()}/card.png${shareQuery(this.cardPeriod(), this.flag(), this.badgeOptions())}`)
  /** The same card from this site: right on a preview deploy or locally too. The Markdown keeps the public address. */
  protected readonly previewUrl = computed(() => `/${this.username()}/card.png${shareQuery(this.cardPeriod(), this.flag(), { v: String(CARD_DESIGN), ...this.badgeOptions() })}`)
  protected readonly fileName = computed(() => `${this.username()}-angularian${this.cardPeriod() === 'all' ? '' : `-${this.cardPeriod()}`}.png`)
  /** The profile's link preview is this card, so a post only needs the link. */
  protected readonly shareLinks = computed(() => {
    const url = this.cardProfileUrl()
    const text = `My contributions to Angular${periodSuffix(this.cardPeriod())} on Angularians`
    return {
      x: `https://x.com/intent/post?${new URLSearchParams({ text, url })}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?${new URLSearchParams({ url })}`,
      bluesky: `https://bsky.app/intent/compose?${new URLSearchParams({ text: `${text} ${url}` })}`,
    }
  })
  protected readonly markdown = computed(() => {
    const alt = `${this.username()}'s Angularian profile${periodSuffix(this.cardPeriod())}`
    return `[![${alt}](${this.cardUrl()})](${this.cardProfileUrl()})`
  })

  private copiedTimer: ReturnType<typeof setTimeout> | undefined
  private loadingSince = 0
  private loadedTimer: ReturnType<typeof setTimeout> | undefined

  /** Each opening starts from the period on screen and the GitHub location's flag. */
  protected resetOnOpen(state: string): void {
    if (state !== 'open') return
    this.cardPeriod.set(this.period())
    this.flag.set(null)
    this.hiddenBadges.set([])
    this.names.set('fun')
    this.shownUrl.set(null)
    this.startLoading()
  }

  protected pickPeriod(value: Period | null | undefined): void {
    if (!value || value === this.cardPeriod()) return
    this.cardPeriod.set(value)
    this.startLoading()
  }

  protected pickFlag(code: string | null): void {
    if (code === this.flag()) return
    this.flag.set(code)
    this.startLoading()
  }

  protected showLoadedCard(url: string): void {
    clearTimeout(this.loadedTimer)
    this.loadedTimer = setTimeout(() => {
      // A later pick may have started another card meanwhile: only the one on screen counts.
      if (url !== this.previewUrl()) return
      this.cardState.set('loaded')
      this.shownUrl.set(url)
    }, Math.max(0, MIN_LOADING_MS - (Date.now() - this.loadingSince)))
  }

  protected showCardError(): void {
    this.cardState.set('error')
  }

  protected selectAll(event: Event): void {
    (event.target as HTMLTextAreaElement).select()
  }

  protected copyLink(): void {
    void this.copy(this.profileUrl(), 'link')
  }

  protected copyMarkdown(): void {
    void this.copy(this.markdown(), 'markdown')
  }

  protected startLoading(): void {
    clearTimeout(this.loadedTimer)
    this.loadingSince = Date.now()
    this.cardState.set('loading')
  }

  private async copy(text: string, what: 'link' | 'markdown'): Promise<void> {
    try {
      await navigator.clipboard.writeText(text)
    }
    catch {
      return
    }
    this.copied.set(what)
    clearTimeout(this.copiedTimer)
    this.copiedTimer = setTimeout(() => this.copied.set(null), 2000)
  }
}
