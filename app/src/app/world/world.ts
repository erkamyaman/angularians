// Ported from nuxt.com `app/components/nuxters/NuxtersWorld.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
import { isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import { afterNextRender, Component, computed, DestroyRef, ElementRef, inject, input, output, PLATFORM_ID, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PODIUM } from '../leaderboard/leaderboard-grid';
import { RankShield } from '../leaderboard/rank-shield';
import { countryName, type ContributorsMap, type ContributorSummary, type CountryStats } from '@angularians/shared';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { remixArrowUpLine, remixCloseLine, remixSearchLine } from '@ng-icons/remixicon';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { HlmTooltip } from '@spartan-ng/helm/tooltip';
import { avatarUrl, flagUrl, formatNumber, matchesCountry } from '../leaderboard/format';
import { Globe } from './globe';

/** People shown on the card of a country. */
const CARD_TILES = 12;

@Component({
  selector: 'app-world',
  imports: [Globe, RankShield, HlmButton, HlmInputGroupImports, HlmSkeleton, HlmTooltip, NgIcon, NgTemplateOutlet, RouterLink],
  providers: [provideIcons({ remixArrowUpLine, remixCloseLine, remixSearchLine })],
  templateUrl: './world.html',
  styleUrl: './world.css',
})
export class World {
  private readonly globeBox = viewChild.required<ElementRef<HTMLElement>>('globeBox');
  /** Set once the globe's box nears the screen, in the browser only: then the globe loads. */
  protected readonly inView = signal(false);

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (typeof IntersectionObserver === 'undefined') {
        this.inView.set(true);
        return;
      }
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        this.inView.set(true);
        observer.disconnect();
      }, { rootMargin: '200px' });
      observer.observe(this.globeBox().nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  readonly map = input.required<ContributorsMap>();
  readonly selected = input<string | null>(null);
  /** The best ranked contributors of the selected country: the first page of its board, empty while it loads. */
  readonly people = input<ContributorSummary[]>([]);
  readonly select = output<string | null>();
  /** "See the N contributors": scroll up to the board, already filtered. */
  readonly leaderboard = output<void>();

  protected readonly current = computed(() => this.map().countries.find(item => item.code === this.selected()) ?? null);
  /** One tile per person shown, known from the count: the card keeps its size while they load. */
  protected readonly tiles = computed(() => Array.from({ length: Math.min(CARD_TILES, this.current()?.count ?? 0) }, (_, index) => this.people()[index] ?? null));
  /** Countries with the same count share a rank: 1, 2, 2, 4. */
  private readonly ranks = computed(() => {
    const firstAt = new Map<number, number>();
    return new Map(this.map().countries.map((item, index) => {
      if (!firstAt.has(item.count)) firstAt.set(item.count, index + 1);
      return [item.code, firstAt.get(item.count)!];
    }));
  });

  protected readonly query = signal('');
  protected readonly shownCountries = computed(() => {
    return this.map().countries.filter(item => matchesCountry(item.code, this.query()));
  });

  protected readonly name = countryName;
  protected readonly number = formatNumber;
  protected readonly flag = flagUrl;
  protected readonly avatar = (person: ContributorSummary) => avatarUrl(person.githubId, 56);
  protected readonly rankOf = (code: string) => this.ranks().get(code) ?? 0;

  private readonly largest = computed(() => this.map().countries[0]?.count ?? 1);
  protected readonly barWidth = (item: CountryStats) => Math.max(2, item.count / this.largest() * 100);
  protected readonly medal = (code: string) => PODIUM[this.rankOf(code)] ?? null;

  protected search(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
}
