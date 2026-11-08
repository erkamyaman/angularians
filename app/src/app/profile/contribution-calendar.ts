import { DOCUMENT } from '@angular/common'
import { afterNextRender, afterRenderEffect, Component, computed, ElementRef, inject, input, output, signal, viewChild } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { octComment, octGitMerge, octIssueOpened, octShield } from '@ng-icons/octicons'
import { remixArrowRightUpLine, remixInformationLine, remixTranslate2 } from '@ng-icons/remixicon'
import { simpleGithub } from '@ng-icons/simple-icons'
import { HlmButton } from '@spartan-ng/helm/button'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'
import { HlmSelectImports } from '@spartan-ng/helm/select'
import { decodeCalendar, isYear, periodPhrase, REPOS, type Period } from '@angularians/shared'
import { formatDay, formatDayInYear } from '../text/date-format'
import { formatNumber } from '../text/number-format'
import { plural } from '../text/plural'
import { contributionGrid } from './contribution-grid'

const COLORS_KEY = 'angularians-graph-colors'
const GREEN_CLASS = 'graph-green'
/** Half a tooltip's width: it stays inside the graph over the first and the last weeks. */
const TIP_HALF = 120

@Component({
  selector: 'app-contribution-calendar',
  imports: [HlmButton, HlmDialogImports, HlmSelectImports, NgIcon],
  providers: [provideIcons({ octComment, octGitMerge, octIssueOpened, octShield, remixArrowRightUpLine, remixInformationLine, remixTranslate2, simpleGithub })],
  host: { '(document:click)': 'closeDayOutside($event)' },
  templateUrl: './contribution-calendar.html',
  styleUrl: './contribution-calendar.css',
})
export class ContributionCalendar {
  readonly days = input.required<readonly number[]>()
  readonly period = input.required<Period>()
  readonly collectedAt = input.required<string>()
  readonly years = input.required<readonly Period[]>()
  readonly periodChange = output<Period>()

  private readonly yearList = viewChild.required<ElementRef<HTMLElement>>('yearList')
  private readonly document = inject(DOCUMENT)

  protected readonly grid = computed(() => contributionGrid(decodeCalendar(this.days()), this.period(), new Date(this.collectedAt())))
  protected readonly summary = computed(() => {
    const { total, activeDays, busiest } = this.grid()
    const year = isYear(this.period())
    const span = periodPhrase(this.shown())
    if (!busiest) return `No contributions ${span}.`
    const when = year ? formatDayInYear(busiest.day) : formatDay(busiest.day)
    if (activeDays === 1) return `${plural(total, 'contribution', 'contributions')} ${span}, on ${when}.`
    const best = busiest.count > 1 ? `, the busiest on ${when} (${formatNumber(busiest.count)})` : ''
    return `${plural(total, 'contribution', 'contributions')} on ${plural(activeDays, 'day', 'days')} ${span}${best}.`
  })
  protected readonly choices = computed(() => [
    ...(this.years().includes('30d') ? [{ period: '30d' as Period, label: 'Last 30 days' }] : []),
    { period: '12m' as Period, label: 'Last 12 months' },
    ...this.years().filter(isYear).sort((a, b) => Number(b) - Number(a)).map(period => ({ period, label: period })),
  ])
  protected readonly choiceLabel = (period: Period) => this.choices().find(choice => choice.period === period)?.label ?? period
  protected readonly shown = computed<Period>(() => (isYear(this.period()) || this.period() === '30d' ? this.period() : '12m'))
  protected readonly hovered = signal<{ label: string, x: number, y: number, source: 'hover' | 'tap' } | null>(null)
  protected readonly weekdays = ['', 'Mon', '', 'Wed', '', 'Fri', '']
  protected readonly levels = [0, 1, 2, 3, 4]
  protected readonly repos = REPOS.map(name => ({ name, url: `https://github.com/${name}` }))
  protected readonly kinds = [
    { icon: 'octGitMerge', tone: 'purple', name: 'Merged pull requests', detail: 'On the day they landed' },
    { icon: 'octIssueOpened', tone: 'green', name: 'Issues and discussions', detail: 'The ones they opened' },
    { icon: 'octComment', tone: 'blue', name: 'Comments and reviews', detail: 'On issues, pull requests, discussions and code' },
    { icon: 'octShield', tone: 'red', name: 'Security advisory credits', detail: 'Credited to them on an Angular advisory' },
    { icon: 'remixTranslate2', tone: 'blue', name: 'Translations', detail: 'Of angular.dev, on the day it was linked' },
  ]
  protected readonly green = signal(false)

  protected showDay(event: PointerEvent): void {
    if (event.pointerType !== 'touch') this.pointAt(event.target as HTMLElement, 'hover')
  }

  protected hideDay(event: PointerEvent): void {
    if (event.pointerType !== 'touch' && this.hovered()?.source === 'hover') this.hovered.set(null)
  }

  protected tapDay(event: PointerEvent): void {
    if (event.pointerType === 'mouse') return
    const cell = event.target as HTMLElement
    const shown = this.hovered()
    if (shown?.source === 'tap' && shown.label === cell.dataset['label']) this.hovered.set(null)
    else this.pointAt(cell, 'tap')
  }

  protected closeDayOutside(event: Event): void {
    if (!(event.target as HTMLElement).closest('.days')) this.hovered.set(null)
  }

  protected closeDay(): void {
    this.hovered.set(null)
  }

  constructor() {
    this.followThePickedYear()
    this.restoreColors()
  }

  protected pickPeriod(period: string | null | undefined): void {
    if (period) this.periodChange.emit(period as Period)
  }

  protected pickColors(green: boolean): void {
    this.green.set(green)
    this.document.documentElement.classList.toggle(GREEN_CLASS, green)
    try {
      localStorage.setItem(COLORS_KEY, green ? 'green' : 'gold')
    }
    catch {}
  }

  private pointAt(cell: HTMLElement, source: 'hover' | 'tap'): void {
    const label = cell.dataset['label']
    if (!label) {
      this.hovered.set(null)
      return
    }
    const box = cell.getBoundingClientRect()
    const graph = cell.closest('.graph')!.getBoundingClientRect()
    const x = Math.min(Math.max(box.left - graph.left + box.width / 2, TIP_HALF), graph.width - TIP_HALF)
    this.hovered.set({ label, x, y: box.top - graph.top, source })
  }

  private followThePickedYear(): void {
    let smooth = false
    afterRenderEffect({
      earlyRead: () => {
        this.shown()
        const list = this.yearList().nativeElement
        const picked = list.querySelector<HTMLElement>('[aria-pressed="true"]')
        return picked ? picked.offsetTop - (list.clientHeight - picked.offsetHeight) / 2 : null
      },
      write: (top) => {
        const to = top()
        if (to === null) return
        this.yearList().nativeElement.scrollTo({ top: to, behavior: smooth && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant' })
        smooth = true
      },
    })
  }

  private restoreColors(): void {
    afterNextRender(() => this.green.set(this.document.documentElement.classList.contains(GREEN_CLASS)))
  }

}
