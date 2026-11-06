import { Component, computed, input } from '@angular/core'

@Component({
  selector: 'app-rank-shield',
  host: { class: 'relative inline-grid place-items-center', 'aria-hidden': 'true', '[style.width.em]': 'wide() ? 2.17 : null' },
  templateUrl: './rank-shield.html',
})
export class RankShield {
  readonly rank = input.required<number>()
  readonly metal = input('text-muted-foreground/60')
  readonly podium = input(false)

  protected readonly scale = computed(() => {
    const digits = String(this.rank()).length
    return digits <= 2 ? '1em' : digits === 3 ? '0.85em' : digits === 4 ? '0.7em' : '0.8em'
  })
  /** 10,000 and up: no inner line, and a wider shield for a number that stays readable. */
  protected readonly wide = computed(() => this.rank() >= 10000)
}
