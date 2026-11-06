import { Component } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { remixSparklingLine } from '@ng-icons/remixicon'

/** One guide: a neutral outline, its colour on hover (on the icon always); every guide the same height. */
export const GUIDE = 'flex min-h-16 items-center gap-3 rounded-lg bg-background p-3 shadow-xs ring-1 ring-border transition hover:shadow-sm dark:bg-background/60 dark:shadow-none dark:hover:bg-muted dark:hover:shadow-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'

@Component({
  selector: 'app-first-pr-guides',
  imports: [NgIcon],
  providers: [provideIcons({ remixSparklingLine })],
  host: { class: 'block' },
  templateUrl: './first-pr-guides.html',
})
export class FirstPrGuides {
  protected readonly guide = GUIDE
}
