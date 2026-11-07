// Ported from nuxt.com `app/components/nuxters/NuxtersWorld.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
import { isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import { afterNextRender, Component, computed, DestroyRef, ElementRef, inject, input, output, PLATFORM_ID, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PODIUM } from '../leaderboard/podium';
import { RankShield } from '../leaderboard/rank-shield';
import { countryName, type ContributorsMap, type ContributorSummary, type CountryStats } from '@angularians/shared';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { remixArrowUpLine, remixCloseLine, remixSearchLine } from '@ng-icons/remixicon';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { HlmTooltip } from '@spartan-ng/helm/tooltip';
import { avatarUrl } from '../contributors/avatar-url';
import { flagUrl } from '../contributors/flag-url';
import { formatNumber, formatRank } from '../text/number-format';
import { pluralWord } from '../text/plural';
import { matchesCountry } from '../contributors/country-match';
import { countryRanks } from './country-ranks';
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
  readonly map = input.required<ContributorsMap>();
  readonly selected = input<string | null>(null);
  /** The best ranked contributors of the selected country: the first page of its board, empty while it loads. */
  readonly people = input<ContributorSummary[]>([]);
  readonly select = output<string | null>();
  /** "See the N contributors": scroll up to the board, already filtered. */
  readonly leaderboard = output<void>();

  private readonly globeBox = viewChild.required<ElementRef<HTMLElement>>('globeBox');

  /** Set once the globe's box nears the screen, in the browser only: then the globe loads. */
  protected readonly inView = signal(false);
  protected readonly query = signal('');

  protected readonly current = computed(() => this.map().countries.find(item => item.code === this.selected()) ?? null);
  /** One tile per person shown, known from the count: the card keeps its size while they load. */
  protected readonly tiles = computed(() => Array.from({ length: Math.min(CARD_TILES, this.current()?.count ?? 0) }, (_, index) => this.people()[index] ?? null));
  private readonly ranks = computed(() => countryRanks(this.map().countries));
  protected readonly shownCountries = computed(() => this.map().countries.filter(item => matchesCountry(item.code, this.query())));
  private readonly largest = computed(() => this.map().countries[0]?.count ?? 1);

  protected readonly name = countryName;
  protected readonly number = formatNumber;
  protected readonly rank = formatRank;
  /** `Angularian` or `Angularians`, for a country's count. */
  protected readonly angularians = (count: number) => pluralWord(count, 'Angularian', 'Angularians');
  /** "See the 12 Angularians", but "See the Angularian": the count, and its space, only for more than one. */
  protected readonly countBefore = (count: number) => (count === 1 ? '' : `${formatNumber(count)} `);
  protected readonly flag = flagUrl;
  protected readonly avatar = (person: ContributorSummary) => avatarUrl(person.githubId, 56);
  protected readonly rankOf = (code: string) => this.ranks().get(code) ?? 0;
  protected readonly barWidth = (item: CountryStats) => Math.max(2, item.count / this.largest() * 100);
  protected readonly medal = (code: string) => PODIUM[this.rankOf(code)] ?? null;

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) this.loadGlobeWhenNear(inject(DestroyRef));
  }

  protected filterCountries(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected showAllCountries(): void {
    this.select.emit(null);
  }

  /** Up to the board, already filtered to the country. */
  protected showBoard(): void {
    this.leaderboard.emit();
  }

  /** A country of the list becomes the selection, or stops being it. */
  protected toggleCountry(code: string): void {
    this.select.emit(code === this.selected() ? null : code);
  }

  private loadGlobeWhenNear(destroyRef: DestroyRef): void {
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
}
