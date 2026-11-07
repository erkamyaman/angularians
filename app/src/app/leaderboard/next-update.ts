import { isPlatformBrowser } from '@angular/common'
import { afterNextRender, Component, computed, DestroyRef, inject, input, PLATFORM_ID, signal } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { remixInformationLine } from '@ng-icons/remixicon'
import { HlmSkeleton } from '@spartan-ng/helm/skeleton'
import { HlmTooltip } from '@spartan-ng/helm/tooltip'
import { formatDate } from '../text/date-format'
import { untilNextCollection } from './next-collection'

/** The time to the next collection is said again every minute. */
const REFRESH_MS = 60_000

/** The longest time the clock can say (one for every minute of a day), to size its place. */
const LONGEST_TIME = Array.from({ length: 24 * 60 }, (_, minute) => untilNextCollection(new Date(Date.UTC(2000, 0, 1, 0, minute))))
  .reduce((longest, time) => (time.length > longest.length ? time : longest))

/** The time depends on the visitor's clock and pages are cached: the server and the first paint draw a skeleton in the label's place. */
@Component({
  selector: 'app-next-update',
  imports: [HlmSkeleton, HlmTooltip, NgIcon],
  providers: [provideIcons({ remixInformationLine })],
  templateUrl: './next-update.html',
  styleUrl: './next-update.css',
})
export class NextUpdate {
  /** When the data on screen was collected. */
  readonly collectedAt = input<string | null>(null)

  private readonly now = signal<Date | null>(null)
  protected readonly time = computed(() => {
    const now = this.now()
    return now ? untilNextCollection(now) : null
  })
  protected readonly longestTime = LONGEST_TIME
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
