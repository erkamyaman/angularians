import { afterRenderEffect, Component, computed, ElementRef, input, viewChild } from '@angular/core'
import { decodeCalendar, isYear, periodPhrase, type Period } from '@angularians/shared'
import { formatDay, formatDayInYear } from '../text/date-format'
import { formatNumber } from '../text/number-format'
import { plural } from '../text/plural'
import { contributionGrid } from './contribution-grid'

@Component({
  selector: 'app-contribution-calendar',
  templateUrl: './contribution-calendar.html',
  styleUrl: './contribution-calendar.css',
})
export class ContributionCalendar {
  readonly days = input.required<readonly number[]>()
  readonly period = input.required<Period>()
  readonly collectedAt = input.required<string>()

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
  protected readonly weekdays = ['', 'Mon', '', 'Wed', '', 'Fri', '']
  protected readonly levels = [0, 1, 2, 3, 4]

  constructor() {
    afterRenderEffect(() => {
      this.grid()
      const element = this.scroller().nativeElement
      element.scrollLeft = element.scrollWidth
    })
  }
}
