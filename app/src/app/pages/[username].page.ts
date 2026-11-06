// Ported from nuxt.com `app/pages/nuxters/[username].vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
// Without the Nuxt-only parts: modules, blog posts, hackathons, the share card and the signed-in owner view.
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { type RouteMeta } from '@analogjs/router';
import { injectResponse } from '@analogjs/router/tokens';
import { countryCode, countryName, DEFAULT_PERIOD, GITHUB_USERNAME_RE, periodOrNull, periodPhrase, reposQuery, type ContributorProfile, type Period } from '@angularians/shared';
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
import { loadedValue, markFailed } from '../data/loaded';
import { missingPeriod, shownPeriod } from '../profile/period-choice';
import { getContributor } from '../data/contributors.server';
import { AngularLogo } from '../layout/angular-logo';
import { Container } from '../layout/container';
import { avatarUrl, flagUrl, formatNumber, formatPoints, plural, profileQuery, shareQuery } from '../leaderboard/format';
import { PeriodTabs } from '../leaderboard/period-tabs';
import { foldPackages, PACKAGE_ICONS, packageIcon, packageLabel } from '../profile/packages';
import { CardPreview } from '../profile/card-preview';
import { ScoreDialog } from '../profile/score-dialog';
import { Share } from '../profile/share';
import { AuthService } from '../auth/auth.service';
import { AngularianPill } from '../layout/angularian-pill';
import { breadcrumbs, setJsonLd, setShareMeta, SITE_SCHEMA, SITE_URL } from '../site';
import { GITHUB_TEXT } from '../leaderboard/github-colors';

export const routeMeta = {
  title: 'Contributor · Angularians',
} satisfies RouteMeta;

/** Links set on a GitHub profile, by provider (`generic` and unknown ones: a link icon). */
const SOCIAL_ICONS: Record<string, string> = {
  twitter: 'simpleX',
  bluesky: 'simpleBluesky',
  linkedin: 'remixLinkedinBoxLine',
  mastodon: 'simpleMastodon',
  youtube: 'simpleYoutube',
  twitch: 'simpleTwitch',
  instagram: 'simpleInstagram',
  facebook: 'simpleFacebook',
  threads: 'simpleThreads',
  reddit: 'simpleReddit',
  npm: 'simpleNpm',
};
const SINCE = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });

function githubSearch(q: string, type: 'pullrequests' | 'issues'): string {
  return `https://github.com/search?${new URLSearchParams({ q: `${reposQuery()} ${q}`, type })}`;
}

@Component({
  selector: 'app-profile',
  imports: [AngularLogo, BadgePill, CardPreview, Container, HlmButton, HlmSkeleton, HlmTooltip, AngularianPill, NgIcon, NgTemplateOutlet, PeriodTabs, RouterLink, ScoreDialog, Share],
  providers: [provideIcons({
    ...BADGE_ICONS,
    vikingAxes, vikingLongship, remixCloseLine, remixArrowLeftLine, remixArrowRightSLine, remixArrowRightUpLine, remixMedalLine, octIssueOpened, octGitMerge, remixInformationLine,
    remixVerifiedBadgeLine, remixArrowDownSLine, remixArrowUpSLine, vikingHelmet, remixLinkM, remixLinkedinBoxLine, octComment,
    octSmiley, vikingShield,
    simpleBluesky, simpleFacebook, simpleGithub, simpleInstagram, simpleMastodon, simpleNpm, simpleReddit, simpleThreads, simpleTwitch, simpleX,
    simpleYoutube, remixStarFill, ...PACKAGE_ICONS,
  })],
  host: { class: 'relative block isolate' },
  templateUrl: './[username].page.html',
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
  /** Every period is in the profile: switching period needs no request. */
  protected readonly profile = injectSeededServerFn(getContributor, () => ({ username: this.username() }));
  protected readonly loaded = loadedValue(this.profile);
  /** GitHub's rule for a username; anything else is not found, not a failed load. */
  protected readonly validUsername = computed(() => GITHUB_USERNAME_RE.test(this.username()));
  protected readonly failedToLoad = computed(() => !!this.profile.error() && this.validUsername());
  private readonly promptClosed = signal(false);
  protected closePrompt(): void {
    this.promptClosed.set(true);
  }
  protected readonly signedOut = computed(() => {
    const state = this.auth.state();
    return !!state?.enabled && !state.user && !this.promptClosed();
  });
  protected readonly isAngularian = computed(() => {
    const person = this.loaded();
    return !!person && !!(person.pullRequests.all || person.helpfulIssues || person.helpfulComments);
  });
  protected readonly signInUrl = (username: string) => this.auth.loginUrl(`/${encodeURIComponent(username)}`);
  protected readonly isOwner = computed(() => {
    const me = this.auth.state()?.user;
    return !!me && me.githubId === this.loaded()?.githubId;
  });

  protected readonly available = computed(() => this.loaded()?.periods.map(row => row.period) ?? ['all']);
  protected readonly period = computed<Period>(() => shownPeriod(this.requested(), this.available()));
  protected readonly missingPeriod = computed(() => (this.loaded() ? missingPeriod(this.requested(), this.available()) : null));
  protected readonly current = computed(() => {
    const person = this.loaded()!;
    return person.periods.find(row => row.period === this.period()) ?? { ...person, period: 'all' };
  });
  /** One card per kind of contribution; the ones GitHub can search link to that search. */
  protected readonly stats = computed(() => {
    const person = this.loaded()!;
    const n = this.current();
    const prs = n.pullRequests;
    return [
      {
        key: 'pullRequests', icon: 'octGitMerge', value: prs.all, name: prs.all === 1 ? 'Merged PR' : 'Merged PRs',
        detail: `${formatNumber(prs.feat)} feat · ${formatNumber(prs.fix)} fix · ${formatNumber(prs.docs)} docs · ${formatNumber(prs.chore)} chore`,
        // GitHub shows most landed PRs as closed (PR Close): this lists all of them, landed or not.
        url: githubSearch(`is:pr author:${person.username}`, 'pullrequests'), label: `${this.githubLabel(person)}`,
        tint: 'bg-[#8250DF]/5 ring-[#8250DF] hover:bg-[#8250DF]/10 dark:ring-[#A371F7]', text: 'text-[#8250DF] dark:text-[#A371F7]',
      },
      {
        key: 'issues', icon: 'octIssueOpened', value: n.issues, name: n.issues === 1 ? 'Issue' : 'Issues', detail: `${formatNumber(n.helpfulIssues)} helpful`,
        url: githubSearch(`is:issue author:${person.username}`, 'issues'), label: `${formatNumber(n.issues)} ${n.issues === 1 ? 'Issue' : 'Issues'} ${periodPhrase(this.period())}. Opens ${person.username}'s issues on GitHub`,
        tint: 'bg-[#1A7F37]/5 ring-[#1A7F37] hover:bg-[#1A7F37]/10 dark:ring-[#3FB950]', text: 'text-[#1A7F37] dark:text-[#3FB950]',
      },
      {
        key: 'comments', icon: 'octComment', value: n.comments, name: n.comments === 1 ? 'Comment' : 'Comments',
        // Inline review comments score on their own (1 pt each): their count goes with the comments.
        detail: `${formatNumber(n.helpfulComments)} helpful · ${plural(n.reviewComments, 'review comment', 'review comments')} on code`,
        url: githubSearch(`commenter:${person.username}`, 'issues'), label: `${formatNumber(n.comments)} ${n.comments === 1 ? 'Comment' : 'Comments'} ${periodPhrase(this.period())}. Opens the issues and pull requests ${person.username} commented on, on GitHub`,
        tint: 'bg-[#0969DA]/5 ring-[#0969DA] hover:bg-[#0969DA]/10 dark:ring-[#58A6FF]', text: 'text-[#0969DA] dark:text-[#58A6FF]',
      },
      {
        key: 'reactions', icon: 'octSmiley', value: n.reactions, name: n.reactions === 1 ? 'Reaction' : 'Reactions', detail: 'received',
        url: null, label: '',
        tint: 'bg-[#9A6700]/5 ring-[#9A6700] dark:ring-[#D29922]', text: 'text-[#9A6700] dark:text-[#D29922]',
      },
    ];
  });
  protected readonly PACKAGES_SHOWN = 12;
  protected readonly allPackages = signal(false);
  /** A package's fill: its PRs against the package with the most, so the tiles compare. */
  protected readonly packageShare = (count: number) => Math.max(2, count / Math.max(1, this.packages()[0]?.pullRequests ?? 1) * 100);
  /** Misspelled scopes (`platform-brower`) folded into the package they mean. */
  protected readonly packages = computed(() => foldPackages(this.loaded()?.packages ?? []));
  protected readonly shownPackages = computed(() => {
    const packages = this.packages();
    return this.allPackages() ? packages : packages.slice(0, this.PACKAGES_SHOWN);
  });
  protected readonly packageLabel = packageLabel;
  protected readonly icon = packageIcon;
  protected readonly plural = plural;
  protected readonly points = formatPoints;
  /** Earned from the data and from the lists in `profile/`: `earnedBadges`, shared with the card. */
  protected readonly badges = computed(() => {
    const person = this.loaded();
    return person ? earnedBadges(person) : [];
  });
  /** The contributor's rank in each period they contributed in, for the period tabs. */
  protected readonly ranks = computed(() => Object.fromEntries((this.loaded()?.periods ?? []).map(row => [row.period, row.rank])));
  /** Gold for the best year, solid when it is the one on screen; the others in the brand colour. */
  protected readonly yearColumn = (row: { period: string }) => {
    const picked = row.period === this.period();
    if (row === this.best()) return picked ? 'bg-[#9A6700] dark:bg-[#D29922]' : 'bg-[#9A6700]/60 group-hover:bg-[#9A6700] dark:bg-[#D29922]/60 dark:group-hover:bg-[#D29922]';
    return picked ? 'bg-primary' : 'bg-primary/40 group-hover:bg-primary/70';
  };
  protected readonly yearsOldestFirst = computed(() => [...this.years()].sort((a, b) => Number(a.period) - Number(b.period)));
  protected readonly peakYear = computed(() => this.years().reduce<ReturnType<typeof this.years>[number] | undefined>((top, row) => (!top || row.score > top.score ? row : top), undefined));
  /** A year's column, in pixels: its points against the year with the most, under room for the labels. */
  protected readonly yearBar = (score: number) => Math.max(4, score / Math.max(1, this.peakYear()?.score ?? 1) * 180);
  protected readonly years = computed(() => (this.loaded()?.periods ?? []).filter(row => /^\d{4}$/.test(row.period)));
  /** Best rank; on a tie (#1 several years), the year with the most points. */
  protected readonly best = computed(() => this.years().reduce<ReturnType<typeof this.years>[number] | undefined>(
    (top, row) => (!top || row.rank < top.rank || (row.rank === top.rank && row.score > top.score) ? row : top), undefined));
  protected readonly displayName = computed(() => this.loaded()?.name || this.loaded()?.username || this.username());
  protected readonly since = computed(() => {
    const date = this.loaded()?.firstContributionAt;
    return date ? SINCE.format(new Date(date)) : null;
  });
  protected readonly links = computed(() => {
    const person = this.loaded();
    if (!person) return [];
    // Links set on GitHub are user input: never followed by crawlers. `me` for Mastodon verification.
    const rel = 'me nofollow noopener noreferrer';
    const all = [
      { url: `https://github.com/${person.username}`, label: `github.com/${person.username}`, icon: 'simpleGithub', rel: 'me noopener' },
      ...(person.website ? [{ url: person.website, label: 'Website', icon: 'remixGlobalLine', rel }] : []),
      ...person.socialAccounts.map(account => ({ url: account.url, label: account.displayName, icon: SOCIAL_ICONS[account.provider] ?? 'remixLinkM', rel })),
    ];
    // A website can also be a social account: one icon per URL, the first wins.
    return all.filter((link, index) => all.findIndex(other => other.url === link.url) === index);
  });
  /** Back to the board of the period on screen; the board's default period keeps its URL clean. */
  /** The board the profile was opened from: its period and, from the grid, its country (`?country=`). */
  private readonly fromCountry = injectQueryParams(params => countryCode(params['country']));
  /** The country the owner picked for the shared card, for this link's preview image. */
  private readonly cardFlag = injectQueryParams(params => countryCode(params['flag']));
  protected readonly backQuery = computed(() => ({
    ...(this.period() === DEFAULT_PERIOD ? {} : { period: this.period() }),
    ...(this.fromCountry() ? { country: this.fromCountry() } : {}),
  }));

  protected readonly avatar = (person: ContributorProfile) => avatarUrl(person.githubId, 160);
  protected readonly colors = GITHUB_TEXT;
  protected readonly number = formatNumber;
  protected readonly phrase = periodPhrase;
  protected readonly country = countryName;
  protected readonly flag = flagUrl;
  protected readonly countryQuery = (code: string) => ({ ...profileQuery(this.period()), country: code });

  constructor() {
    effect(() => {
      const person = this.loaded();
      // Nobody with this username, or a path that cannot be one (`/-x-`): not found.
      if ((person === null || !this.validUsername()) && this.response) this.response.statusCode = 404;
      else if (this.profile.error() && this.response) markFailed(this.response);
      // One URL per profile: /CrisBeto → /crisbeto, keeping the period.
      if (person && person.username !== this.username()) {
        void this.router.navigate(['/', person.username], { queryParamsHandling: 'preserve', replaceUrl: true });
      }
      this.updateHead(person ?? null);
    });
  }

  /** The stats of the picked year are at the top of the page, out of view from the year list. */
  protected scrollToStats(): void {
    const view = this.document.defaultView;
    view?.scrollTo({ top: 0, behavior: view.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  protected setPeriod(period: Period): void {
    void this.router.navigate([], { queryParams: { period: period === 'all' ? null : period }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  protected githubLabel(person: ContributorProfile): string {
    // Starts with the card's visible text ("253 Merged PRs"), so speech input can name it.
    const count = this.current().pullRequests.all;
    return `${formatNumber(count)} ${count === 1 ? 'Merged PR' : 'Merged PRs'} ${periodPhrase(this.period())}. Opens ${person.username}'s pull requests on GitHub`;
  }

  /** Shared links show the period on screen; the canonical URL has none, so search engines see one page per profile. */
  private updateHead(person: ContributorProfile | null): void {
    if (!person) {
      this.title.setTitle(`${this.username()} · Angularians`);
      this.meta.updateTag({ name: 'robots', content: 'noindex' });
      setJsonLd(this.document, null);
      return;
    }
    const current = this.current();
    const title = this.period() === 'all'
      ? `${person.username}, Angularian #${formatNumber(current.rank)}`
      : `${person.username}: #${formatNumber(current.rank)} ${periodPhrase(this.period())}`;
    const description = `${person.username} merged ${plural(current.pullRequests.all, 'pull request', 'pull requests')}, opened ${plural(current.issues, 'issue', 'issues')} and wrote ${plural(current.comments + current.reviewComments, 'comment', 'comments')} in Angular ${periodPhrase(this.period())}: #${formatNumber(current.rank)} with ${formatPoints(current.score)}.`;
    this.title.setTitle(`${title} · Angularians`);
    this.meta.removeTag('name="robots"');
    setShareMeta(this.meta, this.document, {
      title,
      description,
      url: `${SITE_URL}/${person.username}${shareQuery(this.period())}`,
      image: `${SITE_URL}/${person.username}/card.png${shareQuery(this.period(), this.cardFlag())}`,
      canonical: `/${person.username}`,
    });
    // A profile page about a person (the GitHub account; its other links are user input, so not vouched for here),
    // and its place in the site, for search results.
    const url = `${SITE_URL}/${person.username}`;
    setJsonLd(this.document, {
      '@graph': [
        {
          '@type': 'ProfilePage',
          url,
          name: `${title} · Angularians`,
          description,
          isPartOf: SITE_SCHEMA,
          mainEntity: {
            '@type': 'Person',
            name: person.name || person.username,
            alternateName: person.username,
            identifier: String(person.githubId),
            url,
            image: avatarUrl(person.githubId, 320),
            sameAs: [`https://github.com/${person.username}`],
          },
        },
        breadcrumbs([{ name: 'Angularians', path: '/' }, { name: person.name || person.username, path: `/${person.username}` }]),
      ],
    });
  }
}
