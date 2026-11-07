import { afterNextRender, afterRenderEffect, Component, computed, ElementRef, input, output, signal, viewChild } from '@angular/core'
import { decodeCalendar, isYear, periodPhrase, type Period } from '@angularians/shared'
import { formatDay, formatDayInYear } from '../text/date-format'
import { formatNumber } from '../text/number-format'
import { plural } from '../text/plural'
import { contributionGrid } from './contribution-grid'

const COLORS_KEY = 'angularians-graph-colors'

@Component({
  selector: 'app-contribution-calendar',
  host: { '[class.green]': 'green()' },
  templateUrl: './contribution-calendar.html',
  styleUrl: './contribution-calendar.css',
})
export class ContributionCalendar {
  readonly days = input.required<readonly number[]>()
  readonly period = input.required<Period>()
  readonly collectedAt = input.required<string>()
  readonly years = input.required<readonly Period[]>()
  readonly periodChange = output<Period>()

  private readonly scroller = viewChild.required<ElementRef<HTMLElement>>('scroller')

  protected readonly grid = computed(() => contributionGrid(decodeCalendar(this.days()), this.period(), new Date(this.collectedAt())))
  protected readonly summary = computed(() => {
    const { total, activeDays, busiest } = this.grid()
    const year = isYear(this.period())
    const span = periodPhrase(year ? this.period() : '12m')
    if (!busiest) return `No contributions ${span}.`
    const when = year ? formatDayInYear(busiest.day) : formatDay(busiest.day)
    if (activeDays === 1) return `${plural(total, 'contribution', 'contributions')} ${span}, on ${when}.`
    const best = busiest.count > 1 ? `, the busiest on ${when} (${formatNumber(busiest.count)})` : ''
    return `${plural(total, 'contribution', 'contributions')} on ${plural(activeDays, 'day', 'days')} ${span}${best}.`
  })
  protected readonly choices = computed(() => [
    { period: '12m' as Period, label: 'Last 12 months' },
    ...this.years().filter(isYear).sort((a, b) => Number(b) - Number(a)).map(period => ({ period, label: period })),
  ])
  protected readonly shown = computed<Period>(() => (isYear(this.period()) ? this.period() : '12m'))
  protected readonly hovered = signal<{ label: string, x: number, y: number } | null>(null)
  protected readonly weekdays = ['', 'Mon', '', 'Wed', '', 'Fri', '']
  protected readonly levels = [0, 1, 2, 3, 4]
  protected readonly green = signal(false)

  protected hover(event: PointerEvent): void {
    const cell = event.target as HTMLElement
    const label = cell.dataset['label']
    if (!label) return
    const box = cell.getBoundingClientRect()
    const graph = cell.closest('.graph')!.getBoundingClientRect()
    this.hovered.set({ label, x: box.left - graph.left + box.width / 2, y: box.top - graph.top })
  }

  constructor() {
    this.followTheLatestWeeks()
    this.restoreColors()
  }

  protected pickColors(green: boolean): void {
    this.green.set(green)
    try {
      localStorage.setItem(COLORS_KEY, green ? 'green' : 'gold')
    }
    catch {
      // Storage blocked: the choice lasts until the page is left.
    }
  }

  private followTheLatestWeeks(): void {
    afterRenderEffect(() => {
      this.grid()
      const element = this.scroller().nativeElement
      element.scrollLeft = element.scrollWidth
    })
  }

  private restoreColors(): void {
    afterNextRender(() => {
      try {
        this.green.set(localStorage.getItem(COLORS_KEY) === 'green')
      }
      catch {
        // Storage blocked: gold.
      }
    })
  }

}
