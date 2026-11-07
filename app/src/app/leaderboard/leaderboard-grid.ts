// Ported from nuxt.com `app/components/nuxters/NuxtersLeaderboard.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
import { afterRenderEffect, Component, computed, ElementRef, inject, input, linkedSignal, signal, viewChild } from '@angular/core'
import { RouterLink } from '@angular/router'
import { injectServerFnMutation } from '@analogjs/router'
import type { ContributorSummary, LeaderboardPage } from '@angularians/shared'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { remixAddLine, remixLayoutGridLine, remixListUnordered } from '@ng-icons/remixicon'
import { HlmButton } from '@spartan-ng/helm/button'
import { vikingAxes, vikingHelmet, vikingShield } from '../layout/viking-icons'
import { getLeaderboard } from '../data/contributors.server'
import { RankShield } from './rank-shield'
import { LeaderboardMemory, showOneMore, type ShowMoreState } from './leaderboard-memory'
import { PODIUM } from './podium'
import { avatarSrcset, avatarUrl } from '../contributors/avatar-url'
import { formatNumber, formatPoints, formatRank } from '../text/number-format'
import { profileQuery } from './profile-query'

/** The fallback for browsers without srcset: the cells are drawn at 124px at most. */
const AVATAR_SIZE = 56

/** The first page comes server-rendered (50 of it on phones); "Show more" shows the rest, then loads the next pages. */
@Component({
  selector: 'app-leaderboard-grid',
  imports: [HlmButton, NgIcon, RankShield, RouterLink],
  host: { '(window:scroll)': 'followFocus()', '(window:resize)': 'hideTip()', '(document:keydown.escape)': 'hideTip()' },
  providers: [provideIcons({ remixAddLine, remixLayoutGridLine, remixListUnordered, vikingAxes, vikingHelmet, vikingShield })],
  templateUrl: './leaderboard-grid.html',
  styleUrl: './leaderboard-grid.css',
})
export class LeaderboardGrid {
  /** The first page of a period and country. */
  readonly page = input.required<LeaderboardPage>()

  private readonly memory = inject(LeaderboardMemory)
  private readonly fetchPage = injectServerFnMutation(getLeaderboard)
  private readonly tipBox = viewChild<ElementRef<HTMLElement>>('tipBox')

  protected readonly view = this.memory.view
  /**
   * The pages after the first, as "Show more" loaded them: remembered per board, so coming back from a profile shows
   * the same list (and the browser's scroll position lands where it was). Another period or country: its own.
   */
  private readonly shown = linkedSignal<LeaderboardPage, ShowMoreState>({ source: () => this.page(), computation: page => this.memory.get(page) })
  /** Both belong to one board: a failure or a request of the last one must not show on the next. */
  protected readonly loading = linkedSignal({ source: () => this.page(), computation: () => false })
  protected readonly failed = linkedSignal({ source: () => this.page(), computation: () => false })
  private readonly loaded = computed(() => [...this.page().items, ...this.shown().more])
  protected readonly items = computed(() => this.loaded().slice(0, Math.max(this.shown().wide, this.shown().phone)))
  /** On a phone, the ones past this are hidden. */
  protected readonly phoneShown = computed(() => this.shown().phone)
  protected readonly moreWide = computed(() => this.shown().wide < this.page().total)
  protected readonly morePhone = computed(() => this.shown().phone < this.page().total)
  protected readonly query = computed(() => profileQuery(this.page().period, this.page().country))
  protected readonly listLabel = computed(() => `Contributors, ranked: ${formatNumber(this.items().length)} of ${formatNumber(this.page().total)} shown`)
  protected readonly tip = signal<{ item: ContributorSummary, link: HTMLElement, x: number, y: number, bottom: number } | null>(null)

  protected readonly AVATAR_SIZE = AVATAR_SIZE
  protected readonly avatar = (item: ContributorSummary) => avatarUrl(item.githubId, AVATAR_SIZE)
  protected readonly avatars = (item: ContributorSummary) => avatarSrcset(item.githubId)
  protected readonly listAvatar = (item: ContributorSummary) => avatarUrl(item.githubId, 40)
  protected readonly podium = (item: ContributorSummary) => PODIUM[this.place(item)] ?? null
  protected readonly who = (item: ContributorSummary) =>
    item.name && item.name.toLowerCase() !== item.username.toLowerCase() ? `${item.name} (${item.username})` : item.username
  protected readonly overall = (item: ContributorSummary) => formatRank(item.rank)
  protected readonly place = (item: ContributorSummary) => item.countryRank ?? item.rank
  protected readonly rank = (item: ContributorSummary) => formatRank(this.place(item))
  protected readonly label = (item: ContributorSummary) =>
    `${this.who(item)}, ${this.rank(item)}${item.countryRank ? ` in the country, ${this.overall(item)} overall` : ''}, ${this.points(item)}`
  protected readonly points = (item: ContributorSummary) => formatPoints(item.score)

  constructor() {
    afterRenderEffect(() => this.keepTipOnScreen())
  }

  protected showAs(view: 'grid' | 'list'): void {
    this.view.set(view)
  }

  protected hideTip(): void {
    this.tip.set(null)
  }

  protected showTip(event: Event): void {
    const link = (event.target as Element | null)?.closest<HTMLElement>('a[data-index]')
    if (!link) return
    if (event instanceof PointerEvent && event.pointerType === 'touch') return
    if (event.type === 'focusin' && !link.matches(':focus-visible')) return
    const item = this.items()[Number(link.dataset['index'])]
    if (item) this.placeTip(item, link)
  }

  /** The pointer left an avatar, not just for a child of it. */
  protected leaveTip(event: PointerEvent): void {
    const link = (event.target as Element | null)?.closest('a[data-index]')
    if (!link || !link.contains(event.relatedTarget as Node | null)) this.hideTip()
  }

  protected followFocus(): void {
    const shown = this.tip()
    if (shown && shown.link === document.activeElement) this.placeTip(shown.item, shown.link)
    else this.hideTip()
  }

  protected async showMore(): Promise<void> {
    // The period or the country can change while this loads: its items must not join the new board.
    const first = this.page()
    const phone = window.matchMedia('(max-width: 639.98px)').matches
    const shown = showOneMore(this.shown(), phone)
    const needed = Math.min(Math.max(shown.wide, shown.phone), first.total)
    const reveal = (more: ContributorSummary[]) => {
      this.shown.set({ ...shown, more })
      this.memory.set(first, this.shown())
    }
    if (this.loaded().length >= needed) return reveal(this.shown().more)
    const next = Math.floor(this.loaded().length / first.items.length) + 1
    this.loading.set(true)
    this.failed.set(false)
    try {
      const page = await this.fetchPage({ period: first.period, country: first.country, page: next })
      if (first === this.page()) reveal([...this.shown().more, ...page.items])
    }
    catch {
      if (first === this.page()) this.failed.set(true)
    }
    finally {
      if (first === this.page()) this.loading.set(false)
    }
  }

  private placeTip(item: ContributorSummary, link: HTMLElement): void {
    const box = link.getBoundingClientRect()
    this.tip.set({ item, link, x: box.left + box.width / 2, y: box.top, bottom: box.bottom })
  }

  /** The tip stays inside the window and below the sticky header: shifted sideways, or turned below its link. */
  private keepTipOnScreen(): void {
    const box = this.tipBox()?.nativeElement
    const shown = this.tip()
    if (!box || !shown) return
    const arrow = box.querySelector<HTMLElement>('[data-arrow]')
    box.style.marginLeft = ''
    box.style.marginTop = ''
    delete box.dataset['side']
    if (arrow) arrow.style.marginLeft = ''
    const { left, right, top, height } = box.getBoundingClientRect()
    const shift = left < 8 ? 8 - left : right > innerWidth - 8 ? innerWidth - 8 - right : 0
    if (shift) {
      box.style.marginLeft = `${shift}px`
      if (arrow) arrow.style.marginLeft = `${-shift}px`
    }
    const header = document.querySelector('app-site-header')?.getBoundingClientRect().bottom ?? 0
    if (top < header + 8) {
      box.style.marginTop = `${shown.bottom - shown.y + 16 + height}px`
      box.dataset['side'] = 'bottom'
    }
  }
}
