import { isPlatformBrowser } from '@angular/common'
import { afterNextRender, Component, computed, ElementRef, inject, input, PLATFORM_ID, viewChild } from '@angular/core'
import { decodeCalendar, type Period } from '@angularians/shared'
import { formatDate } from '../text/date-format'
import { formatNumber } from '../text/number-format'
import { plural } from '../text/plural'
import { contributionGrid, type ContributionDay } from './contribution-grid'

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
  protected readonly span = computed(() => (/^\d{4}$/.test(this.period()) ? `in ${this.period()}` : 'in the last 12 months'))
  protected readonly summary = computed(() => {
    const { total, activeDays, busiest } = this.grid()
    if (!busiest) return `No contributions ${this.span()}.`
    const best = busiest.count > 1 ? `, the most on ${formatDate(busiest.day)} (${formatNumber(busiest.count)})` : ''
    return `${plural(total, 'contribution', 'contributions')} on ${plural(activeDays, 'day', 'days')} ${this.span()}${best}.`
  })
  protected readonly weekdays = ['', 'Mon', '', 'Wed', '', 'Fri', '']

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      afterNextRender(() => {
        const element = this.scroller().nativeElement
        element.scrollLeft = element.scrollWidth
      })
    }
  }

  protected title(cell: ContributionDay): string {
    return `${cell.count ? plural(cell.count, 'contribution', 'contributions') : 'No contributions'} on ${formatDate(cell.day)}`
  }
}
