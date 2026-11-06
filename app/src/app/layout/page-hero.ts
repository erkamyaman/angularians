import { Component, input } from '@angular/core';
import { Container } from './container';

/**
 * The top of a page (Nuxt UI `UPageHero`, as on nuxt.com/nuxters): a heading, a description and optional actions,
 * with an optional card beside them on wide screens (`heroAside`).
 */
@Component({
  selector: 'app-page-hero',
  imports: [Container],
  host: { class: 'block' },
  templateUrl: './page-hero.html',
})
export class PageHero {
  readonly title = input('')
  readonly description = input<string | null>(null)
}
