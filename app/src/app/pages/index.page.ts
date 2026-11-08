// Ported from nuxt.com `app/pages/nuxters/index.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
import { DOCUMENT } from '@angular/common';
import { afterRenderEffect, Component, computed, effect, inject, linkedSignal, untracked } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { type RouteMeta } from '@analogjs/router';
import { injectResponse } from '@analogjs/router/tokens';
import { countryCode, countryName, DEFAULT_PERIOD, HELPFUL_COMMENT_REACTIONS, HELPFUL_ISSUE_COMMENTS, HELPFUL_ISSUE_REACTIONS, periodOrNull, periodPhrase, type LeaderboardPage, type Period } from '@angularians/shared';
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
import { loadedValue } from '../data/loaded';
import { markFailed } from '../data/mark-failed';
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
import { LAUNCH_POST, SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from '../site';
import { setJsonLd, setShareMeta } from '../seo-head';
import { boardHead } from '../leaderboard/board-head';
import { boardJsonLd } from '../leaderboard/board-json-ld';
import { boardTotals } from '../leaderboard/board-totals';
import { formatNumber } from '../text/number-format';
import { ClaimBadge } from '../leaderboard/claim-badge';
import { EarnBadges } from '../leaderboard/earn-badges';
import { JoinLinks } from '../leaderboard/join-links';
import { LaunchPostCallout } from '../leaderboard/launch-post-callout';
import { LeaderboardGrid } from '../leaderboard/leaderboard-grid';
import { PeriodTabs } from '../leaderboard/period-tabs';
import { World } from '../world/world';
import type { GithubColor } from '../leaderboard/github-color';

export const routeMeta = {
  title: SITE_TITLE,
  meta: [{ name: 'description', content: SITE_DESCRIPTION }],
} satisfies RouteMeta;

@Component({
  host: { '(window:wheel)': 'forgetWorldPlace()', '(window:touchmove)': 'forgetWorldPlace()' },
  selector: 'app-home',
  imports: [
    LaunchPostCallout,
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

  /** The board's totals over it, each in its GitHub colour (none for the people). */
  protected readonly totals = computed(() => {
    const page = this.board();
    return page ? boardTotals(page) : [];
  });
  /** The best ranked people of the country on the globe's card: the board's, once it is that country's. */
  protected readonly countryPeople = computed(() => {
    const page = this.board();
    return page && page.country === this.country() ? page.items : [];
  });
  protected readonly errorMessage = computed(() => {
    if (!this.leaderboard.error()) return 'The countries could not be loaded.';
    return this.board() ? 'This board could not be loaded.' : 'The leaderboard could not be loaded.';
  });
  protected readonly placeholders = Array.from({ length: 30 }, (_, index) => index);
  protected readonly launchPost = LAUNCH_POST;
  /** The three ways onto the board (Nuxters' "How to become a Nuxter"). */
  protected readonly becomeWays = [
    { title: 'Merge a pull request', action: 'Read the guide', description: 'Fix a bug, ship a feature or improve the docs in any Angular repository.', icon: 'octGitMerge', color: 'purple', url: 'https://github.com/angular/angular/blob/main/CONTRIBUTING.md' },
    { title: 'Open a helpful issue', action: 'See the issues', description: `An issue that gets completed, or collects ${HELPFUL_ISSUE_REACTIONS}+ reactions or ${HELPFUL_ISSUE_COMMENTS}+ comments.`, icon: 'octIssueOpened', color: 'green', url: 'https://github.com/angular/angular/issues' },
    { title: 'Write a helpful comment', action: 'Answer a discussion', description: `Answer a question on an issue, a PR or a discussion: a comment with ${HELPFUL_COMMENT_REACTIONS}+ reactions, or an accepted answer, counts.`, icon: 'remixChatHeartLine', color: 'blue', url: 'https://github.com/angular/angular/discussions' },
  ] satisfies readonly { color: GithubColor, [key: string]: unknown }[];
  protected readonly number = formatNumber;
  protected readonly phrase = periodPhrase;

  /**
   * The board sits above the globe and changes height with the country (a small one has a few avatars):
   * a pick on the globe keeps the globe where it is on screen once that board renders. The top of the world
   * section when the pick was made, or `null`.
   */
  private keepWorldAt: number | null = null;

  constructor() {
    afterRenderEffect(() => this.keepWorldInPlace(this.board()));
    effect(() => this.updateHead(this.boardValue()));
  }

  /** Same page, no new history entry, scroll position kept. The default period leaves the URL clean. */
  protected setPeriod(period: Period): void {
    this.keepWorldAt = null;
    void this.router.navigate([], { queryParams: { period: period === DEFAULT_PERIOD ? null : period }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  /** An empty board: "No contributions in 2015 from France yet." */
  protected emptyBoardText(page: LeaderboardPage): string {
    return `No contributions ${periodPhrase(page.period)}${page.country ? ` from ${countryName(page.country)}` : ''} yet.`;
  }

  protected worldDescription(countries: number): string {
    return ` from ${formatNumber(countries)} countries ${periodPhrase(this.period())}. Pick a country to see its best ranked contributors.`;
  }

  /** A pick on the globe or its list: the globe stays where it is on screen. */
  protected pickInWorld(country: string | null): void {
    this.setCountry(country);
    this.keepWorldAt = document.getElementById('world')?.getBoundingClientRect().top ?? null;
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
    this.keepWorldAt = null;
    void this.router.navigate([], { queryParams: { country }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  /** The visitor scrolled while the board loads: their scroll wins. */
  protected forgetWorldPlace(): void {
    this.keepWorldAt = null;
  }

  /** Once the board of a country picked on the globe renders, the globe is back where it was on screen. */
  private keepWorldInPlace(page: LeaderboardPage | undefined): void {
    untracked(() => {
      if (this.keepWorldAt === null || page?.country !== this.country()) return;
      const top = document.getElementById('world')?.getBoundingClientRect().top;
      if (top !== undefined && top !== this.keepWorldAt) scrollBy({ top: top - this.keepWorldAt, behavior: 'instant' });
      this.keepWorldAt = null;
    });
  }

  /** The title, the link preview and the structured data of the board on screen. */
  private updateHead(page: LeaderboardPage | undefined): void {
    if ((this.leaderboard.error() || this.map.error()) && this.response) markFailed(this.response);
    const shared = this.requestedPeriod() && page?.total ? page.period : null;
    const country = this.country() && page?.total ? this.country() : null;
    const { title, description } = boardHead(page, shared, country);
    this.title.setTitle(title);
    // The site's card, or the card of the shared period. The canonical URL has no `?period=`; a country keeps its own.
    const query = shared ? `?period=${shared}` : '';
    const canonical = country ? `/?country=${country}` : '/';
    setShareMeta(this.meta, this.document, { title, description, url: `${SITE_URL}/${query}`, image: `${SITE_URL}/og.png${query}`, canonical });
    setJsonLd(this.document, boardJsonLd(country));
  }
}
