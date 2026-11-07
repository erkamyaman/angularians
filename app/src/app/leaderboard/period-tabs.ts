// Ported from nuxt.com `app/components/nuxters/NuxtersPeriodTabs.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
import { Component, computed, input, linkedSignal, output } from '@angular/core'
import { isYear, periodPhrase, type Period } from '@angularians/shared'
import { HlmSelectImports } from '@spartan-ng/helm/select'
import { HlmTabsImports } from '@spartan-ng/helm/tabs'
import { formatRank } from '../text/number-format'

const TAB_LABELS: Record<string, string> = { '30d': '30 days', '12m': '12 months', 'all': 'All time' }
const YEAR = 'year'

/** 30 days, 12 months and all time as tabs; the years in a picker next to them. */
@Component({
  selector: 'app-period-tabs',
  imports: [HlmSelectImports, HlmTabsImports],
  templateUrl: './period-tabs.html',
  styleUrl: './period-tabs.css',
})
export class PeriodTabs {
  /** The period on screen. */
  readonly period = input.required<Period>()
  /** The periods with data, in display order. */
  readonly periods = input.required<Period[]>()
  /** The contributor's rank in each period, shown next to it (a profile). `null`: no ranks (the leaderboard). */
  readonly ranks = input<Partial<Record<Period, number>> | null>(null)
  /** The accessible name of the tab list. */
  readonly label = input('Leaderboard period')
  readonly periodChange = output<Period>()

  /** Follows a click right away: `period` only changes once the new board has loaded. */
  private readonly selected = linkedSignal(() => this.period())
  protected readonly phraseOf = (period: string) => periodPhrase(period).replace(/^(in|of) /, '')
  protected readonly tabs = computed(() => ['30d', '12m', 'all']
    .filter(value => this.periods().includes(value))
    .map(value => ({ value, label: TAB_LABELS[value]! })))
  protected readonly years = computed(() => this.periods().filter(isYear))
  protected readonly year = computed(() => (this.years().includes(this.selected()) ? this.selected() : null))
  /** A year matches no tab: none is active. */
  protected readonly activeTab = computed(() => (this.year() ? YEAR : this.selected()))
  /** `#12`, or `null` without a rank for that period. */
  protected readonly rankOf = (period: Period): string | null => {
    const rank = this.ranks()?.[period]
    return rank ? formatRank(rank) : null
  }
  /** The year on the closed picker, with its rank when there is one: "2019 #2". */
  protected readonly yearLabel = (value: string | null) => (value ? [value, this.rankOf(value)].filter(Boolean).join(' ') : '')

  protected pickTab(value: string): void {
    if (value === YEAR || value === this.selected()) return
    this.select(value)
  }

  protected pickYear(value: unknown): void {
    if (typeof value === 'string' && value !== this.selected()) this.select(value)
  }

  private select(value: Period): void {
    this.selected.set(value)
    this.periodChange.emit(value)
  }
}
