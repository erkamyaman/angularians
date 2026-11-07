import { Component, computed, input } from '@angular/core'
import { AngularLogo } from '../layout/angular-logo'
import { formatMonth } from '../text/date-format'

/** "Angular contributor since Apr 2025", on the profile and the signed-in card: the parent lays it out. */
@Component({
  selector: 'app-contributor-since',
  imports: [AngularLogo],
  templateUrl: './contributor-since.html',
  styleUrl: './contributor-since.css',
})
export class ContributorSince {
  /** The first contribution, ISO. */
  readonly date = input.required<string>()
  protected readonly month = computed(() => formatMonth(this.date()))
}
