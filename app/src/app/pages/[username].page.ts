// Ported from nuxt.com `app/pages/nuxters/[username].vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
// Without the Nuxt-only parts: modules, blog posts, hackathons, the share card and the signed-in owner view.
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, linkedSignal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { type RouteMeta } from '@analogjs/router';
import { injectResponse } from '@analogjs/router/tokens';
import { countryCode, countryName, DEFAULT_PERIOD, GITHUB_USERNAME_RE, isYear, periodOrNull, periodPhrase, type ContributorPeriodStats, type ContributorProfile, type Period } from '@angularians/shared';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { remixArrowDownSLine, remixArrowLeftLine, remixArrowRightSLine, remixArrowRightUpLine, remixArrowUpSLine, remixCloseLine, remixInformationLine, remixLinkM, remixLinkedinBoxLine, remixMedalLine, remixStarFill, remixVerifiedBadgeLine } from '@ng-icons/remixicon';
import { vikingAxes, vikingHelmet, vikingLongship, vikingShield } from '../layout/viking-icons';
import { octComment, octGitMerge, octIssueOpened, octSmiley } from '@ng-icons/octicons';
import {
  simpleBluesky, simpleFacebook, simpleGithub, simpleInstagram, simpleMastodon, simpleNpm, simpleReddit, simpleThreads, simpleTwitch, simpleX,
  simpleYoutube,
} from '@ng-icons/simple-icons';
import { BADGE_ICONS, earnedBadges } from '../profile/earned-badges';
import { BadgePill } from '../profile/badge-pill';
import { injectParams } from 'ngxtension/inject-params';
import { injectQueryParams } from 'ngxtension/inject-query-params';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { HlmTooltip } from '@spartan-ng/helm/tooltip';
import { injectSeededServerFn } from '../data/seeded-server-fn';
import { loadedValue } from '../data/loaded';
import { markFailed } from '../data/mark-failed';
import { missingPeriod, shownPeriod } from '../profile/shown-period';
import { getContributor } from '../data/contributors.server';
import { Container } from '../layout/container';
import { avatarUrl } from '../contributors/avatar-url';
import { flagUrl } from '../contributors/flag-url';
import { formatNumber, formatPoints, formatRank } from '../text/number-format';
import { plural, pluralWord } from '../text/plural';
import { profileQuery } from '../leaderboard/profile-query';
import { shareQuery } from '../profile/share-query';
import { PeriodTabs } from '../leaderboard/period-tabs';
import { foldPackages, PACKAGE_ICONS, packageIcon, packageLabel } from '../profile/packages';
import { CardPreview } from '../profile/card-preview';
import { profileHead } from '../profile/profile-head';
import { profileJsonLd } from '../profile/profile-json-ld';
import { profileLinks } from '../profile/profile-links';
import { profileStats } from '../profile/profile-stats';
import { ContributionCalendar } from '../profile/contribution-calendar';
import { ContributorSince } from '../profile/contributor-since';
import { ScoreDialog } from '../profile/score-dialog';
import { showsSignInPrompt } from '../profile/sign-in-prompt';
import { Share } from '../profile/share';
import { AuthService } from '../auth/auth.service';
import { AngularianPill } from '../layout/angularian-pill';
import { SITE_URL } from '../site';
import { setJsonLd, setShareMeta } from '../seo-head';

export const routeMeta = {
  title: 'Contributor · Angularians',
} satisfies RouteMeta;

@Component({
  selector: 'app-profile',
  imports: [BadgePill, CardPreview, ContributionCalendar, Container, ContributorSince, HlmButton, HlmSkeleton, HlmTooltip, AngularianPill, NgIcon, NgTemplateOutlet, PeriodTabs, RouterLink, ScoreDialog, Share],
  providers: [provideIcons({
    ...BADGE_ICONS,
    vikingAxes, vikingLongship, remixCloseLine, remixArrowLeftLine, remixArrowRightSLine, remixArrowRightUpLine, remixMedalLine, octIssueOpened, octGitMerge, remixInformationLine,
    remixVerifiedBadgeLine, remixArrowDownSLine, remixArrowUpSLine, vikingHelmet, remixLinkM, remixLinkedinBoxLine, octComment,
    octSmiley, vikingShield,
    simpleBluesky, simpleFacebook, simpleGithub, simpleInstagram, simpleMastodon, simpleNpm, simpleReddit, simpleThreads, simpleTwitch, simpleX,
    simpleYoutube, remixStarFill, ...PACKAGE_ICONS,
  })],
  templateUrl: './[username].page.html',
  styleUrl: './[username].page.css',
})
export default class Profile {
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly response = injectResponse();
  private readonly auth = inject(AuthService);

  protected readonly username = injectParams(params => String(params['username'] ?? ''));
  private readonly requested = injectQueryParams(params => periodOrNull(params['period']));
  /** The board the profile was opened from: its period and, from the grid, its country (`?country=`). */
  private readonly fromCountry = injectQueryParams(params => countryCode(params['country']));
  /** The country the owner picked for the shared card, for this link's preview image. */
  private readonly cardFlag = injectQueryParams(params => countryCode(params['flag']));
  /** Every period is in the profile: switching period needs no request. */
  protected readonly profile = injectSeededServerFn(getContributor, () => ({ username: this.username() }));

  protected readonly loaded = loadedValue(this.profile);
  /** GitHub's rule for a username; anything else is not found, not a failed load. */
  protected readonly validUsername = computed(() => GITHUB_USERNAME_RE.test(this.username()));
  protected readonly failedToLoad = computed(() => !!this.profile.error() && this.validUsername());
  private readonly promptClosed = linkedSignal({ source: () => this.username(), computation: () => false });
  /** The "Is this your profile?" prompt, until closed: `showsSignInPrompt`. */
  protected readonly signedOut = computed(() => !this.promptClosed() && showsSignInPrompt(this.auth.state(), this.auth.wasSignedIn()));
  protected readonly isAngularian = computed(() => {
    const person = this.loaded();
    return !!person && !!(person.pullRequests.all || person.helpfulIssues || person.helpfulComments);
  });
  protected readonly isOwner = computed(() => {
    const me = this.auth.state()?.user;
    return !!me && me.githubId === this.loaded()?.githubId;
  });
  /** The profile, when it is the signed-in visitor's own. */
  protected readonly ownProfile = computed(() => (this.isOwner() ? this.loaded() : undefined));

  protected readonly available = computed(() => this.loaded()?.periods.map(row => row.period) ?? ['all']);
  protected readonly period = computed<Period>(() => shownPeriod(this.requested(), this.available()));
  protected readonly missingPeriod = computed(() => (this.loaded() ? missingPeriod(this.requested(), this.available()) : null));
  protected readonly current = computed(() => {
    const person = this.loaded()!;
    return person.periods.find(row => row.period === this.period()) ?? { ...person, period: 'all' };
  });
  protected readonly stats = computed(() => profileStats(this.loaded()!.username, this.current(), this.period()));
  protected readonly PACKAGES_SHOWN = 12;
  /** Phones show fewer packages before "Show all". */
  protected readonly PACKAGES_SHOWN_PHONE = 5;
  protected readonly allPackages = linkedSignal({ source: () => this.username(), computation: () => false });
  /** Misspelled scopes (`platform-brower`) folded into the package they mean. */
  protected readonly packages = computed(() => foldPackages(this.loaded()?.packages ?? []));
  protected readonly packagesToggleLabel = computed(() => (this.allPackages() ? 'Show less' : `Show all ${this.packages().length}`));
  protected readonly shownPackages = computed(() => {
    const packages = this.packages();
    return this.allPackages() ? packages : packages.slice(0, this.PACKAGES_SHOWN);
  });
  /** Earned from the data and from the lists in `profile/`: `earnedBadges`, shared with the card. */
  protected readonly badges = computed(() => {
    const person = this.loaded();
    return person ? earnedBadges(person) : [];
  });
  /** The contributor's rank in each period they contributed in, for the period tabs. */
  protected readonly ranks = computed(() => Object.fromEntries((this.loaded()?.periods ?? []).map(row => [row.period, row.rank])));
  protected readonly years = computed(() => (this.loaded()?.periods ?? []).filter(row => isYear(row.period)));
  protected readonly yearsOldestFirst = computed(() => [...this.years()].sort((a, b) => Number(a.period) - Number(b.period)));
  protected readonly firstYear = computed<ContributorPeriodStats | undefined>(() => this.yearsOldestFirst()[0]);
  private readonly peakYear = computed(() => this.years().reduce<ReturnType<typeof this.years>[number] | undefined>((top, row) => (!top || row.score > top.score ? row : top), undefined));
  /** Best rank; on a tie (#1 several years), the year with the most points. */
  protected readonly best = computed(() => this.years().reduce<ReturnType<typeof this.years>[number] | undefined>(
    (top, row) => (!top || row.rank < top.rank || (row.rank === top.rank && row.score > top.score) ? row : top), undefined));
  protected readonly displayName = computed(() => this.loaded()?.name || this.loaded()?.username || this.username());
  protected readonly links = computed(() => {
    const person = this.loaded();
    return person ? profileLinks(person) : [];
  });
  /** Back to the board of the period on screen; the board's default period keeps its URL clean. */
  protected readonly backQuery = computed(() => ({
    ...(this.period() === DEFAULT_PERIOD ? {} : { period: this.period() }),
    ...(this.fromCountry() ? { country: this.fromCountry() } : {}),
  }));

  protected readonly signInUrl = (username: string) => this.auth.loginUrl(`/${encodeURIComponent(username)}`);
  /** A package's fill: its PRs against the package with the most, so the tiles compare. */
  protected readonly packageShare = (count: number) => Math.max(2, count / Math.max(1, this.packages()[0]?.pullRequests ?? 1) * 100);
  /** A year's column, in pixels: its points against the year with the most, under room for the labels. */
  protected readonly yearBar = (score: number) => Math.max(4, score / Math.max(1, this.peakYear()?.score ?? 1) * 180);
  protected readonly packageLabel = packageLabel;
  protected readonly icon = packageIcon;
  protected readonly plural = plural;
  protected readonly points = formatPoints;
  protected readonly avatar = (person: ContributorProfile) => avatarUrl(person.githubId, 160);
  protected readonly number = formatNumber;
  protected readonly rank = formatRank;
  protected readonly word = pluralWord;
  protected readonly phrase = periodPhrase;
  protected readonly country = countryName;
  protected readonly flag = flagUrl;
  protected readonly countryQuery = (code: string) => ({ ...profileQuery(this.period()), country: code });

  constructor() {
    effect(() => this.followProfile(this.loaded()));
  }

  protected closePrompt(): void {
    this.promptClosed.set(true);
  }

  protected toggleAllPackages(): void {
    this.allPackages.update(all => !all);
  }

  /** A year's bar on hover: "2025 · Rank #12 · 300 pts". */
  protected yearTip(row: ContributorPeriodStats): string {
    return `${row.period} · Rank ${formatRank(row.rank)} · ${formatPoints(row.score)}`;
  }

  /** The first year shows the longship, unless it is also the best year, which shows the helmet. */
  protected marksSagaStart(row: ContributorPeriodStats): boolean {
    return row === this.firstYear() && row !== this.best();
  }

  /** Numbers over a bar: the year on screen and the best year. */
  protected showsYearScore(row: ContributorPeriodStats): boolean {
    return row.period === this.period() || row === this.best();
  }

  protected retry(): void {
    this.profile.reload();
  }

  /** A year's bar as a screen reader names it. */
  protected yearLabel(row: ContributorPeriodStats): string {
    return `${row.period}, rank ${formatNumber(row.rank)}, ${formatPoints(row.score)}${row === this.firstYear() ? ', the first year' : ''}`;
  }

  /** The stats of the picked year are at the top of the page, out of view from the year list. */
  protected scrollToStats(): void {
    const view = this.document.defaultView;
    view?.scrollTo({ top: 0, behavior: view.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  protected setPeriod(period: Period): void {
    void this.router.navigate([], { queryParams: { period: period === 'all' ? null : period }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  /** The response status, the one URL per profile, and the page's head, for the profile once loaded. */
  private followProfile(person: ContributorProfile | null | undefined): void {
    // Nobody with this username, or a path that cannot be one (`/-x-`): not found.
    if ((person === null || !this.validUsername()) && this.response) this.response.statusCode = 404;
    else if (this.profile.error() && this.response) markFailed(this.response);
    // One URL per profile: /CrisBeto → /crisbeto, keeping the period.
    if (person && person.username !== this.username()) {
      void this.router.navigate(['/', person.username], { queryParamsHandling: 'preserve', replaceUrl: true });
    }
    this.updateHead(person ?? null);
  }

  /** Shared links show the period on screen; the canonical URL has none, so search engines see one page per profile. */
  private updateHead(person: ContributorProfile | null): void {
    if (!person) {
      this.title.setTitle(`${this.username()} · Angularians`);
      this.meta.updateTag({ name: 'robots', content: 'noindex' });
      setJsonLd(this.document, null);
      return;
    }
    const { title, description } = profileHead(person, this.current(), this.period());
    this.title.setTitle(`${title} · Angularians`);
    this.meta.removeTag('name="robots"');
    setShareMeta(this.meta, this.document, {
      title,
      description,
      url: `${SITE_URL}/${person.username}${shareQuery(this.period())}`,
      image: `${SITE_URL}/${person.username}/card.png${shareQuery(this.period(), this.cardFlag())}`,
      canonical: `/${person.username}`,
    });
    setJsonLd(this.document, profileJsonLd(person, { title, description }));
  }
}
