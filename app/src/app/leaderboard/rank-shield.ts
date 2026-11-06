import { Component, computed, input } from '@angular/core'

@Component({
  selector: 'app-rank-shield',
  host: { 'aria-hidden': 'true', '[class.wide]': 'wide()' },
  templateUrl: './rank-shield.html',
  styleUrl: './rank-shield.css',
})
export class RankShield {
  readonly rank = input.required<number>()
  readonly podium = input(false)

  /** The number's length, from 2 to 5: longer numbers are set smaller (`rank-shield.css`). */
  protected readonly digits = computed(() => Math.min(5, Math.max(2, String(this.rank()).length)))
  /** 10,000 and up: no inner line, and a wider shield for a number that stays readable. */
  protected readonly wide = computed(() => this.rank() >= 10000)
}
