import { isPlatformBrowser } from '@angular/common'
import { afterNextRender, Component, computed, DestroyRef, inject, input, PLATFORM_ID, signal } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { remixInformationLine } from '@ng-icons/remixicon'
import { HlmTooltip } from '@spartan-ng/helm/tooltip'
import { formatDate } from '../text/date-format'
import { untilNextCollection } from './next-collection'

/** The time to the next collection is said again every minute. */
const REFRESH_MS = 60_000

/** The label: the time to the next collection, from the visitor's clock; words without it. */
const nextUpdateLabel = (now: Date | null) => (now ? `Next update starts in ${untilNextCollection(now)}` : 'Updated every day')

/** The longest label the clock can say (one for every minute of a day, and the words), to size its place. */
const LONGEST_LABEL = [null, ...Array.from({ length: 24 * 60 }, (_, minute) => new Date(Date.UTC(2000, 0, 1, 0, minute)))]
  .map(nextUpdateLabel)
  .reduce((longest, label) => (label.length > longest.length ? label : longest))

/** The time depends on the visitor's clock and pages are cached: the server and the first paint say it in words. */
@Component({
  selector: 'app-next-update',
  imports: [HlmTooltip, NgIcon],
  providers: [provideIcons({ remixInformationLine })],
  templateUrl: './next-update.html',
  styleUrl: './next-update.css',
})
export class NextUpdate {
  /** When the data on screen was collected. */
  readonly collectedAt = input<string | null>(null)

  private readonly now = signal<Date | null>(null)
  protected readonly label = computed(() => nextUpdateLabel(this.now()))
  protected readonly longestLabel = LONGEST_LABEL
  protected readonly hint = computed(() => {
    const collected = this.collectedAt()
    return `Updated nightly from 03:17 UTC.${collected ? ` Data from ${formatDate(collected)}.` : ''}`
  })

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) this.startClock(inject(DestroyRef))
  }

  /** After the first paint, in the browser: the visitor's clock, read again every minute. */
  private startClock(destroyRef: DestroyRef): void {
    afterNextRender(() => {
      this.now.set(new Date())
      const timer = setInterval(() => this.now.set(new Date()), REFRESH_MS)
      destroyRef.onDestroy(() => clearInterval(timer))
    })
  }
}
