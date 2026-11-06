import { Component, computed, input } from '@angular/core';
import { Container } from './container';

const brandParts = (text: string) => text.split(/(Angularians?)/)

/** A titled block of a page (Nuxt UI `UPageSection`). `sectionId` makes it a link target. */
@Component({
  selector: 'app-page-section',
  imports: [Container],
  host: { class: 'block scroll-mt-20 outline-none', '[attr.id]': 'sectionId()', '[attr.tabindex]': 'sectionId() ? -1 : null', '[attr.role]': "title() || ownHeading() ? 'region' : null", '[attr.aria-labelledby]': 'title() || ownHeading() ? headingId() : null' },
  templateUrl: './page-section.html',
})
export class PageSection {
  readonly title = input('')
  readonly ownHeading = input(false)
  /** The whole title in the brand font. */
  readonly viking = input(false)
  /** Every other part is the word "Angularian(s)", in the brand font. */
  protected readonly titleParts = computed(() => brandParts(this.title()))
  readonly description = input<string | null>(null)
  protected readonly descriptionParts = computed(() => brandParts(this.description() ?? ''))
  readonly sectionId = input<string | null>(null)
  /** No top padding: the section continues the one above (the leaderboard under the hero, as on Nuxters). */
  readonly flush = input(false)

  protected headingId() {
    return `${this.sectionId() ?? 'section'}-title`
  }
}
