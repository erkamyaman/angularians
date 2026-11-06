// Ported from nuxt.com `app/pages/nuxters/index.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
import { DOCUMENT } from '@angular/common';
import { afterRenderEffect, Component, computed, effect, inject, linkedSignal, untracked } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { type RouteMeta } from '@analogjs/router';
import { injectResponse } from '@analogjs/router/tokens';
import { countryCode, countryName, DEFAULT_PERIOD, periodOrNull, periodPhrase, type Period } from '@angularians/shared';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { remixArrowRightUpLine, remixCalendarLine, remixChatHeartLine, remixGroupLine } from '@ng-icons/remixicon';
import { octComment, octGitMerge, octIssueOpened } from '@ng-icons/octicons';
import { vikingLongship } from '../layout/viking-icons';
import { injectQueryParams } from 'ngxtension/inject-query-params';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { getContributorsMap, getLeaderboard } from '../data/contributors.server';
import { injectSeededServerFn } from '../data/seeded-server-fn';
import { loadedValue, markFailed } from '../data/loaded';
import { PageGrid } from '../layout/page-grid';
import { AngularLogo } from '../layout/angular-logo';
import { LogoMark } from '../layout/logo-mark';
import { PageHero } from '../layout/page-hero';
import { PageSection } from '../layout/page-section';
import { ContributorSearch } from '../leaderboard/contributor-search';
import { CountrySelect } from '../leaderboard/country-select';
import { NextUpdate } from '../leaderboard/next-update';
import { MeCard } from '../leaderboard/me-card';
import { ScoreRules } from '../leaderboard/score-rules';
import { breadcrumbs, setJsonLd, setShareMeta, SITE_SCHEMA, SITE_URL } from '../site';
import { boardDescription, formatDate, formatNumber, plural } from '../leaderboard/format';
import { ClaimBadge } from '../leaderboard/claim-badge';
import { EarnBadges } from '../leaderboard/earn-badges';
import { JoinLinks } from '../leaderboard/join-links';
import { LeaderboardGrid } from '../leaderboard/leaderboard-grid';
import { PeriodTabs } from '../leaderboard/period-tabs';
import { World } from '../world/world';
import { GITHUB_TEXT } from '../leaderboard/github-colors';

const SITE_DESCRIPTION = 'Everyone who has contributed to Angular since 2014, ranked: merged pull requests, issues, comments and code reviews in angular/angular, Components, the CLI, dev-infra, Domino, zone.js and Universal.';

/** The home page's title: the name, then what the site is, for search results. */
const SITE_TITLE = 'Angularians · Every Angular contributor, ranked';

export const routeMeta = {
  title: SITE_TITLE,
  meta: [{ name: 'description', content: SITE_DESCRIPTION }],
} satisfies RouteMeta;

@Component({
  selector: 'app-home',
  imports: [
    ClaimBadge, EarnBadges, JoinLinks,
    AngularLogo, ContributorSearch, CountrySelect, HlmButton, HlmCardImports, HlmSkeleton, LeaderboardGrid, LogoMark, MeCard, NextUpdate, NgIcon, ScoreRules,
    PageGrid, PageHero, PageSection, PeriodTabs, World,
  ],
  providers: [provideIcons({ vikingLongship, remixArrowRightUpLine, remixCalendarLine, octIssueOpened, octGitMerge, octComment, remixChatHeartLine, remixGroupLine })],
  templateUrl: './index.page.html',
})
export default class Home {
  private readonly router = inject(Router);
  private readonly response = injectResponse();
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  /** `?period=` and `?country=` are the state: shareable, and kept on reload. Unknown values fall back. */
  private readonly requestedPeriod = injectQueryParams(params => periodOrNull(params['period']));
  protected readonly country = injectQueryParams(params => countryCode(params['country']));
  protected readonly period = computed(() => this.requestedPeriod() ?? DEFAULT_PERIOD);

  protected readonly leaderboard = injectSeededServerFn(getLeaderboard, () => ({ period: this.period(), country: this.country(), page: 1 }));
  /** Countries of the same period, for the filter and the globe. */
  protected readonly map = injectSeededServerFn(getContributorsMap, () => ({ period: this.period() }));
  private readonly boardValue = loadedValue(this.leaderboard);
  private readonly loadedMap = loadedValue(this.map);
  /** The last countries stay too, so the country filter does not vanish while the next period loads. */
  protected readonly mapValue = linkedSignal<ReturnType<typeof this.loadedMap>, ReturnType<typeof this.loadedMap>>({
    source: () => this.loadedMap(),
    computation: (value, previous) => value ?? previous?.value,
  });
  /** The last board stays on screen, dimmed, while the next one loads, or if it fails: no jump to skeletons. */
  protected readonly board = linkedSignal<ReturnType<typeof this.boardValue>, ReturnType<typeof this.boardValue>>({
    source: () => this.boardValue(),
    computation: (value, previous) => value ?? previous?.value,
  });

  protected readonly placeholders = Array.from({ length: 30 }, (_, index) => index);
  /** The three ways onto the board (Nuxters' "How to become a Nuxter"). */
  protected readonly becomeWays = [
    { title: 'Merge a pull request', action: 'Read the guide', description: 'Fix a bug, ship a feature or improve the docs in any Angular repository.', icon: 'octGitMerge', color: GITHUB_TEXT.purple, url: 'https://github.com/angular/angular/blob/main/CONTRIBUTING.md' },
    { title: 'Open a helpful issue', action: 'See the issues', description: 'An issue that gets completed, or collects 3+ reactions or 5+ comments.', icon: 'octIssueOpened', color: GITHUB_TEXT.green, url: 'https://github.com/angular/angular/issues' },
    { title: 'Write a helpful comment', action: 'Review a pull request', description: 'Answer a question or review a PR: a comment with 3+ reactions counts.', icon: 'remixChatHeartLine', color: GITHUB_TEXT.blue, url: 'https://github.com/angular/angular/pulls' },
  ];
  protected readonly colors = GITHUB_TEXT;
  protected readonly number = formatNumber;
  protected readonly phrase = periodPhrase;
  protected readonly date = formatDate;
  protected readonly countryLabel = countryName;

  /**
   * The board sits above the globe and changes height with the country (a small one has a few avatars):
   * a pick on the globe keeps the globe where it is on screen once that board renders. The top of the world
   * section when the pick was made, or `null`.
   */
  private keepWorldAt: number | null = null;

  constructor() {
    afterRenderEffect(() => {
      const page = this.board();
      untracked(() => {
        if (this.keepWorldAt === null || page?.country !== this.country()) return;
        const top = document.getElementById('world')?.getBoundingClientRect().top;
        if (top !== undefined && top !== this.keepWorldAt) scrollBy({ top: top - this.keepWorldAt, behavior: 'instant' });
        this.keepWorldAt = null;
      });
    });

    // A shared `?period=` link gets its own title and description, and so does a country's board (its own page for
    // search engines too); the plain page keeps the generic ones.
    effect(() => {
      const page = this.boardValue();
      if ((this.leaderboard.error() || this.map.error()) && this.response) markFailed(this.response);
      const shared = this.requestedPeriod() && page?.total ? page : null;
      const country = this.country() && page?.total ? this.country() : null;
      const where = country ? ` in ${countryName(country)}` : '';
      const title = shared
        ? `Top Angularians${where} ${periodPhrase(shared.period)}`
        : country ? `Top Angularians in ${countryName(country)} · Angular contributors` : SITE_TITLE;
      const description = shared
        ? boardDescription(shared, shared.period)
        : country ? `The ${formatNumber(page!.total)} people from ${countryName(country)} who have contributed to Angular since 2014, ranked: merged pull requests, issues, comments and code reviews.` : SITE_DESCRIPTION;
      this.title.setTitle(title);
      // The site's card, or the card of the shared period. The canonical URL has no `?period=`; a country keeps its own.
      const query = shared ? `?period=${shared.period}` : '';
      const canonical = country ? `/?country=${country}` : '/';
      setShareMeta(this.meta, this.document, { title, description, url: `${SITE_URL}/${query}`, image: `${SITE_URL}/og.png${query}`, canonical });
      // The site itself, and a country's board as a step below it.
      setJsonLd(this.document, country
        ? breadcrumbs([{ name: 'Angularians', path: '/' }, { name: `Angular contributors in ${countryName(country)}`, path: canonical }])
        : { ...SITE_SCHEMA, description: SITE_DESCRIPTION });
    });
  }

  /** Same page, no new history entry, scroll position kept. The default period leaves the URL clean. */
  protected setPeriod(period: Period): void {
    void this.router.navigate([], { queryParams: { period: period === DEFAULT_PERIOD ? null : period }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  protected worldDescription(countries: number): string {
    return ` from ${formatNumber(countries)} countries ${periodPhrase(this.period())}. Pick a country to see its best ranked contributors.`;
  }

  /** A pick on the globe or its list: the globe stays where it is on screen. */
  protected pickInWorld(country: string | null): void {
    this.keepWorldAt = document.getElementById('world')?.getBoundingClientRect().top ?? null;
    this.setCountry(country);
  }

  /** From the country card: up to the board, already filtered on that country. */
  protected showLeaderboard(): void {
    this.keepWorldAt = null;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('leaderboard')?.scrollIntoView({ behavior: reduce ? 'instant' : 'smooth' });
  }

  protected retry(): void {
    if (this.leaderboard.error()) this.leaderboard.reload();
    if (this.map.error()) this.map.reload();
  }

  protected setCountry(country: string | null): void {
    void this.router.navigate([], { queryParams: { country }, queryParamsHandling: 'merge', replaceUrl: true });
  }
}
