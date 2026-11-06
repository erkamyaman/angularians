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
import { shareQuery } from '../leaderboard/format'

/** The skeleton shows at least this long, so a fast card does not flicker it. */
const MIN_LOADING_MS = 500
/** A box of the 1200 × 630 card, in percent of it: the skeleton is measured on the card (`server/card/card.ts`). */
const box = (x: number, y: number, width: number, height: number, round = false) => ({ left: x / 12, top: y / 6.3, width: width / 12, height: height / 6.3, round })
const TILES = [[508, 56], [834, 56], [508, 276], [834, 276]] as const
const TILE_BOXES = TILES.map(([x, y]) => box(x, y, 302, 196))
/** The first load, before there is a card to show: changing the period keeps the card and dims it instead. */
const SKELETON_BOXES = [
  box(64, 56, 124, 124, true),
  box(64, 196, 270, 46),
  box(64, 258, 180, 76),
  box(64, 348, 200, 34),
  box(64, 520, 320, 66),
  box(884, 520, 252, 66),
  ...TILES.flatMap(([x, y]) => [box(x + 26, y + 26, 40, 40, true), box(x + 26, y + 78, 150, 52), box(x + 26, y + 138, 150, 28)]),
]

/** Raise it when the card's design changes, so the preview does not show a copy the browser kept. */
export const CARD_DESIGN = 15

/** Copy the profile link, or the Markdown of the Angularian card for a GitHub profile README. */
@Component({
  selector: 'app-share',
  imports: [CountrySelect, HlmButton, HlmDialogImports, HlmSkeleton, NgIcon, NgTemplateOutlet, PeriodTabs],
  providers: [provideIcons({ remixCheckLine, remixDownloadLine, remixFileCopyLine, remixImageLine, remixLinkedinBoxFill, remixShareLine, simpleBluesky, simpleX, remixLinkM, remixMarkdownLine })],
  host: { class: 'flex flex-wrap items-center gap-2' },
  templateUrl: './share.html',
})
export class Share {
  readonly username = input.required<string>()
  /** The link and the card share the period on screen (all time by default). */
  readonly period = input<Period>('all')
  /** The periods the contributor is in: the README card can show any of them. */
  readonly periods = input<readonly Period[]>([])
  /** The country of the GitHub location, when it has one. */
  readonly country = input<string | null | undefined>(null)

  protected readonly copied = signal<'link' | 'markdown' | null>(null)
  /** The card renders on demand: its background and a loader meanwhile. */
  protected readonly tileBoxes = TILE_BOXES
  protected readonly skeletonBoxes = SKELETON_BOXES
  protected readonly cardState = signal<'loading' | 'loaded' | 'error'>('loading')
  /** The last card that loaded: it stays under the next one while that renders. */
  protected readonly shownUrl = signal<string | null>(null)
  protected readonly cardPeriod = linkedSignal(() => this.period())
  /** A country picked for this card only. `null`: the GitHub location. */
  protected readonly flag = signal<string | null>(null)
  protected readonly allCountries = Object.keys(COUNTRIES).map(code => ({ code, count: 0, top: [] }))
  protected readonly name = countryName
  protected readonly flagLabel = computed(() => {
    const country = this.country()
    return country ? `GitHub: ${countryName(country)}` : 'No flag'
  })
  protected readonly cardPeriods = computed(() => sortPeriods(['all', ...this.periods()]))

  private readonly profileUrl = computed(() => `${SITE_URL}/${this.username()}${shareQuery(this.period())}`)
  protected readonly cardUrl = computed(() => `${SITE_URL}/${this.username()}/card.png${shareQuery(this.cardPeriod(), this.flag())}`)
  /** The same card from this site: right on a preview deploy or locally too. The Markdown keeps the public address. */
  protected readonly previewUrl = computed(() => `/${this.username()}/card.png${shareQuery(this.cardPeriod(), this.flag(), { v: String(CARD_DESIGN) })}`)
  protected readonly fileName = computed(() => `${this.username()}-angularian${this.cardPeriod() === 'all' ? '' : `-${this.cardPeriod()}`}.png`)
  /** The profile's link preview is this card, so a post only needs the link. */
  protected readonly shareLinks = computed(() => {
    const period = this.cardPeriod()
    const url = `${SITE_URL}/${this.username()}${shareQuery(period, this.flag())}`
    const text = `My contributions to Angular${period === 'all' ? '' : ` ${periodPhrase(period)}`} on Angularians`
    return {
      x: `https://x.com/intent/post?${new URLSearchParams({ text, url })}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?${new URLSearchParams({ url })}`,
      bluesky: `https://bsky.app/intent/compose?${new URLSearchParams({ text: `${text} ${url}` })}`,
    }
  })
  protected readonly markdown = computed(() => {
    const alt = `${this.username()}'s Angularian profile${this.cardPeriod() === 'all' ? '' : ` ${periodPhrase(this.cardPeriod())}`}`
    return `[![${alt}](${this.cardUrl()})](${SITE_URL}/${this.username()}${shareQuery(this.cardPeriod(), this.flag())})`
  })

  private timer: ReturnType<typeof setTimeout> | undefined

  protected opened(state: string): void {
    if (state !== 'open') return
    this.cardPeriod.set(this.period())
    this.flag.set(null)
    this.shownUrl.set(null)
    this.startLoading()
  }

  protected pick(value: Period | null | undefined): void {
    if (!value || value === this.cardPeriod()) return
    this.cardPeriod.set(value)
    this.startLoading()
  }

  protected pickFlag(code: string | null): void {
    if (code === this.flag()) return
    this.flag.set(code)
    this.startLoading()
  }

  private loadingSince = 0
  private loadedTimer: ReturnType<typeof setTimeout> | undefined

  private startLoading(): void {
    clearTimeout(this.loadedTimer)
    this.loadingSince = Date.now()
    this.cardState.set('loading')
  }

  protected loaded(url: string): void {
    clearTimeout(this.loadedTimer)
    this.loadedTimer = setTimeout(() => {
      // A later pick may have started another card meanwhile: only the one on screen counts.
      if (url !== this.previewUrl()) return
      this.cardState.set('loaded')
      this.shownUrl.set(url)
    }, Math.max(0, MIN_LOADING_MS - (Date.now() - this.loadingSince)))
  }


  protected select(event: Event): void {
    (event.target as HTMLTextAreaElement).select()
  }

  protected copyLink(): void {
    void this.copy(this.profileUrl(), 'link')
  }

  protected copyMarkdown(): void {
    void this.copy(this.markdown(), 'markdown')
  }

  private async copy(text: string, what: 'link' | 'markdown'): Promise<void> {
    try {
      await navigator.clipboard.writeText(text)
    }
    catch {
      return
    }
    this.copied.set(what)
    clearTimeout(this.timer)
    this.timer = setTimeout(() => this.copied.set(null), 2000)
  }
}
