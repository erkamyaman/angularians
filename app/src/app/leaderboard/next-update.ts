import { isPlatformBrowser } from '@angular/common'
import { afterNextRender, Component, computed, DestroyRef, inject, input, PLATFORM_ID, signal } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { remixInformationLine } from '@ng-icons/remixicon'
import { HlmTooltip } from '@spartan-ng/helm/tooltip'
import { formatDate } from './format'

/** The nightly collection's schedule, in UTC: `cron` in `.github/workflows/collect.yml`. */
const COLLECT_HOUR = 3
const COLLECT_MINUTE = 17
const MINUTE = 60_000

/** Time until the next collection starts: "5h 20m", "20m", or "under a minute". */
export function untilNextCollection(now: Date): string {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), COLLECT_HOUR, COLLECT_MINUTE)
  const target = next > now.getTime() ? next : next + 24 * 60 * MINUTE
  const minutes = Math.ceil((target - now.getTime()) / MINUTE)
  if (minutes <= 1) return 'under a minute'
  const hours = Math.floor(minutes / 60)
  return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`
}

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
  protected readonly label = computed(() => {
    const now = this.now()
    return now ? `Next update starts in ${untilNextCollection(now)}` : 'Updated every day'
  })
  protected readonly hint = computed(() => {
    const collected = this.collectedAt()
    return `Updated nightly from 03:17 UTC.${collected ? ` Data from ${formatDate(collected)}.` : ''}`
  })

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return
    const destroyRef = inject(DestroyRef)
    afterNextRender(() => {
      this.now.set(new Date())
      const timer = setInterval(() => this.now.set(new Date()), MINUTE)
      destroyRef.onDestroy(() => clearInterval(timer))
    })
  }
}
