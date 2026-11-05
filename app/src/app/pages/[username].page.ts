// Ported from nuxt.com `app/pages/nuxters/[username].vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
// Without the Nuxt-only parts: modules, blog posts, hackathons, the share card and the signed-in owner view.
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { injectServerFn, type RouteMeta } from '@analogjs/router';
import { injectResponse } from '@analogjs/router/tokens';
import { countryCode, countryName, DEFAULT_PERIOD, GITHUB_USERNAME_RE, isPeriod, periodPhrase, reposQuery, type ContributorProfile, type Period } from '@angularians/shared';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { remixArrowDownSLine, remixArrowLeftLine, remixArrowRightUpLine, remixArrowUpSLine, remixCloseLine, remixInformationLine, remixLinkM, remixLinkedinBoxLine, remixMedalLine, remixVerifiedBadgeLine } from '@ng-icons/remixicon';
import { vikingAxes, vikingHelmet, vikingLongship, vikingShield } from '../layout/viking-icons';
import { octComment, octGitMerge, octIssueOpened, octSmiley } from '@ng-icons/octicons';
import {
  simpleBluesky, simpleFacebook, simpleGithub, simpleInstagram, simpleMastodon, simpleNpm, simpleReddit, simpleThreads, simpleTwitch, simpleX,
  simpleYoutube,
} from '@ng-icons/simple-icons';
import { injectParams } from 'ngxtension/inject-params';
import { injectQueryParams } from 'ngxtension/inject-query-params';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { HlmTooltip } from '@spartan-ng/helm/tooltip';
import { getContributor } from '../data/contributors.server';
import { AngularLogo } from '../layout/angular-logo';
import { Container } from '../layout/container';
import { avatarUrl, flagUrl, formatNumber, formatPoints, plural, profileQuery } from '../leaderboard/format';
import { PeriodTabs } from '../leaderboard/period-tabs';
import { foldPackages, PACKAGE_ICONS, packageIcon, packageLabel } from '../profile/packages';
import { CardPreview } from '../profile/card-preview';
import { ScoreDialog } from '../profile/score-dialog';
import { Share } from '../profile/share';
import { AuthService } from '../auth/auth.service';
import { LogoMark } from '../layout/logo-mark';
import { setCanonical, SITE_URL } from '../site';

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

/** Years as ranges: [2019, 2024, 2025, 2026] → "2019, 2024–2026". */
export function yearRanges(years: readonly number[]): string {
  const parts: string[] = [];
  for (let i = 0; i < years.length; i++) {
    let j = i;
    while (j + 1 < years.length && years[j + 1] === years[j]! + 1) j++;
    parts.push(j > i ? `${years[i]}–${years[j]}` : `${years[i]}`);
    i = j;
  }
  return parts.join(', ');
}

/** By GitHub id (a username can change): the people behind the community tools in the footer, with their logos. */
const TOOL_PEOPLE: Readonly<Record<number, { name: string, role: 'creator' | 'maintainer', logo: string }>> = {
  42211: { name: 'AnalogJS', role: 'creator', logo: '/credits/analogjs.svg' }, // brandonroberts
  35136007: { name: 'spartan/ui', role: 'creator', logo: '/credits/spartan.svg' }, // goetzrobin
  20795331: { name: 'ng-icons', role: 'creator', logo: '/credits/ng-icons.svg' }, // ashley-hunter
  25516557: { name: 'ngxtension', role: 'creator', logo: '/credits/ngxtension.svg' }, // nartc
  25394362: { name: 'ngxtension', role: 'maintainer', logo: '/credits/ngxtension.svg' }, // eneajaho
};

@Component({
  selector: 'app-profile',
  imports: [AngularLogo, CardPreview, Container, HlmButton, HlmSkeleton, HlmTooltip, LogoMark, NgIcon, NgTemplateOutlet, PeriodTabs, RouterLink, ScoreDialog, Share],
  providers: [provideIcons({
    vikingAxes, vikingLongship, remixCloseLine, remixArrowLeftLine, remixArrowRightUpLine, remixMedalLine, octIssueOpened, octGitMerge, remixInformationLine,
    remixVerifiedBadgeLine, remixArrowDownSLine, remixArrowUpSLine, vikingHelmet, remixLinkM, remixLinkedinBoxLine, octComment,
    octSmiley, vikingShield,
    simpleBluesky, simpleFacebook, simpleGithub, simpleInstagram, simpleMastodon, simpleNpm, simpleReddit, simpleThreads, simpleTwitch, simpleX,
    simpleYoutube, ...PACKAGE_ICONS,
  })],
  host: { class: 'relative block isolate' },
  template: `
    <app-container class="pt-8">
      <a hlmBtn variant="link" class="px-0" routerLink="/" [queryParams]="backQuery()">
        <ng-icon name="remixArrowLeftLine" aria-hidden="true" />All contributors
      </a>
    </app-container>

    @if (profile.value(); as person) {
      <app-container class="py-8 lg:py-14">
        <div class="grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-5 lg:gap-12">
          <div class="flex min-w-0 flex-col items-start gap-5 lg:col-span-2">
            <!-- w-full: a long name truncates instead of widening the page on phones -->
            <div class="flex w-full min-w-0 items-center gap-4 lg:gap-5">
              <img [src]="avatar(person)" [alt]="person.username" width="160" height="160" class="size-32 shrink-0 rounded-xl bg-muted ring-1 ring-border sm:size-40" />
              <div class="flex min-w-0 flex-1 flex-col gap-1">
                <h1 class="truncate text-3xl font-bold tracking-tight sm:text-4xl" [title]="displayName()">{{ displayName() }}</h1>
                @if (person.name) {
                  <p class="truncate text-lg text-muted-foreground">{{ person.username }}</p>
                }
                @if (isAngularian()) {
                  <p class="my-1 inline-flex h-8 w-fit items-center gap-1.5 rounded-md bg-primary/10 px-2 text-base font-medium text-primary">
                    <app-logo-mark class="size-6" compact /><span class="brand leading-none">Angularian</span>
                  </p>
                }
                <ul class="-ml-2 flex flex-wrap items-center gap-0.5" aria-label="Links">
                  @for (link of links(); track link.url) {
                    <li>
                      <a hlmBtn variant="ghost" size="icon-sm" [href]="link.url" target="_blank" [attr.rel]="link.rel" [attr.aria-label]="link.label" [hlmTooltip]="link.label" class="text-muted-foreground hover:text-foreground">
                        <ng-icon [name]="link.icon" aria-hidden="true" />
                      </a>
                    </li>
                  }
                </ul>
              </div>
            </div>

            <div class="flex w-full flex-col gap-4">
              <div class="flex items-center gap-4">
                <p class="brand text-7xl leading-none text-primary">#{{ number(current().rank) }}</p>
                <div class="flex min-w-0 flex-col">
                  <p class="inline-flex items-center gap-1 text-lg tabular-nums">
                    <strong class="font-semibold text-primary">{{ number(current().score) }} {{ current().score === 1 ? 'pt' : 'pts' }}</strong>
                    <app-score-dialog [stats]="current()" [phrase]="phrase(period())" />
                  </p>
                  <p class="text-sm text-muted-foreground">{{ phrase(period()) }}</p>
                </div>
              </div>
              <div class="flex flex-col items-start gap-1.5 text-sm text-muted-foreground">
                @if (person.country) {
                  <!-- nofollow: crawlers would render every country × period. -->
                  <a routerLink="/" [queryParams]="countryQuery(person.country)" fragment="leaderboard" rel="nofollow" class="inline-flex items-center gap-1.5 hover:text-foreground">
                    <img [src]="flag(person.country)" alt="" width="16" height="16" class="size-4 shrink-0 rounded-full" />{{ country(person.country) }}
                  </a>
                }
                @if (since(); as date) {
                  <span class="inline-flex items-center gap-1.5"><app-angular-logo class="size-4" /><span><span class="font-medium text-foreground">Angular contributor</span> since {{ date }}</span></span>
                }
                @if (best(); as year) {
                  <a [routerLink]="[]" [queryParams]="{ period: year.period }" replaceUrl class="inline-flex items-center gap-1.5 font-medium text-[#9A6700] tabular-nums transition-opacity hover:opacity-80 dark:text-[#D29922]">
                    <ng-icon name="vikingHelmet" size="1.25rem" aria-hidden="true" /><span class="brand relative top-[0.09em] text-base leading-none">Greatest saga</span> {{ year.period }}, #{{ number(year.rank) }} with {{ points(year.score) }}
                  </a>
                }
              </div>
              @if (badges().length) {
                <ul class="flex flex-wrap gap-2" aria-label="Badges">
                  @for (badge of badges(); track badge.label) {
                    <li [class]="'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm ring-1 ' + badge.style" [hlmTooltip]="badge.title">
                      @if (badge.icon === 'angular') {
                        <app-angular-logo class="size-4" />
                      } @else if (badge.logo) {
                        <img [src]="badge.logo" alt="" width="16" height="16" class="size-4 shrink-0 object-contain" />
                      } @else {
                        <ng-icon [name]="badge.icon" [size]="badge.icon.startsWith('viking') ? '1.25rem' : '1em'" aria-hidden="true" />
                      }
                      {{ badge.label }}
                    </li>
                  }
                </ul>
              }
              <!-- Your own profile: share it (the period on screen). In the browser only: the page is cached for everyone. -->
              @if (isOwner()) {
                <app-share class="hidden lg:flex" [username]="person.username" [period]="period()" [periods]="available()" [country]="person.country" />
              }
              <!-- Signed out, known only in the browser: the page is cached for everyone. -->
              @if (signedOut()) {
                <section class="flex w-full flex-col gap-3 rounded-xl bg-muted/40 p-4 ring-1 ring-border" aria-labelledby="profile-sign-in">
                  <div>
                    <div class="flex items-center justify-between gap-2">
                      <p id="profile-sign-in" class="font-medium">Is this your profile?</p>
                      <button hlmBtn variant="ghost" size="icon-sm" type="button" class="-my-1 -mr-1 text-muted-foreground" aria-label="Close" (click)="closePrompt()"><ng-icon name="remixCloseLine" aria-hidden="true" /></button>
                    </div>
                    <p class="mt-1 text-sm text-pretty text-muted-foreground">Sign in with GitHub to verify it and share your <span class="brand text-primary">Angularian</span> card.</p>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <app-card-preview [username]="person.username" [signInUrl]="signInUrl(person.username)" />
                    <a hlmBtn class="bg-foreground text-background hover:bg-foreground/90" [href]="signInUrl(person.username)"><ng-icon name="simpleGithub" aria-hidden="true" /> Sign in</a>
                  </div>
                </section>
              }
            </div>
          </div>

          <div class="flex flex-col gap-6 lg:col-span-3">
            <div class="flex lg:justify-end">
              <app-period-tabs [period]="period()" [periods]="available()" [ranks]="ranks()" label="Profile period" (periodChange)="setPeriod($event)" />
            </div>

            <ul class="grid grid-cols-2 gap-4" [attr.aria-label]="'Contributions ' + phrase(period())">
              @for (stat of stats(); track stat.key) {
                <li>
                  @if (stat.url) {
                    <a
                      [href]="stat.url"
                      target="_blank"
                      rel="noopener"
                      [attr.aria-label]="stat.label"
                      [class]="'group relative block h-full rounded-xl p-5 ring-1 transition ' + stat.tint"
                    >
                      <ng-icon name="remixArrowRightUpLine" size="20" class="absolute top-5 right-5 text-muted-foreground group-hover:text-foreground" aria-hidden="true" />
                      <ng-container [ngTemplateOutlet]="statBody" [ngTemplateOutletContext]="{ $implicit: stat }" />
                    </a>
                  } @else {
                    <div [class]="'h-full rounded-xl p-5 ring-1 ' + stat.tint">
                      <ng-container [ngTemplateOutlet]="statBody" [ngTemplateOutletContext]="{ $implicit: stat }" />
                    </div>
                  }
                </li>
              }
            </ul>
            <ng-template #statBody let-stat>
              <ng-icon [name]="stat.icon" [class]="stat.text" size="24" aria-hidden="true" />
              <p class="mt-3 text-4xl font-semibold tabular-nums">{{ number(stat.value) }}</p>
              <p [class]="'mt-1 ' + stat.text">{{ stat.name }}</p>
              <p class="mt-1 text-sm text-muted-foreground tabular-nums">{{ stat.detail }}</p>
            </ng-template>

          </div>
        </div>
      </app-container>

      @if (packages().length) {
        <app-container class="pb-12">
          <section aria-labelledby="packages-title">
            <h2 id="packages-title" class="mb-1 text-2xl font-medium tracking-tight">Contributed to</h2>
            <p class="mb-6 text-muted-foreground">Merged PRs in {{ plural(packages().length, 'package', 'packages') }} of Angular, by PRs.</p>
            <ul class="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-3">
              @for (item of shownPackages(); track item.name) {
                <li class="relative overflow-hidden rounded-xl bg-muted/30 p-4 ring-1 ring-border">
                  <span class="absolute inset-y-0 left-0 bg-primary/10" [style.width.%]="packageShare(item.pullRequests)" aria-hidden="true"></span>
                  <div class="relative flex items-center gap-3">
                    <ng-icon [name]="icon(item.name)" size="1.5rem" class="shrink-0 text-primary" aria-hidden="true" />
                    <span class="min-w-0 flex-1">
                      <!-- title: the whole name when it is cut (@angular/material-moment-adapter) -->
                      <span class="block truncate font-medium" [title]="item.name">{{ item.name }}</span>
                      <span class="block truncate text-xs text-muted-foreground" [title]="packageLabel(item.name)">{{ packageLabel(item.name) }}</span>
                    </span>
                    <span class="shrink-0 text-right tabular-nums">
                      <span class="text-lg font-semibold">{{ number(item.pullRequests) }}</span>
                      <span class="text-xs text-muted-foreground"> {{ item.pullRequests === 1 ? 'PR' : 'PRs' }}</span>
                    </span>
                  </div>
                </li>
              }
            </ul>
            @if (packages().length > PACKAGES_SHOWN) {
              <button hlmBtn variant="outline" type="button" class="mt-4" (click)="allPackages.set(!allPackages())">
                {{ allPackages() ? 'Show less' : 'Show all ' + packages().length }}
                <ng-icon [name]="allPackages() ? 'remixArrowUpSLine' : 'remixArrowDownSLine'" aria-hidden="true" />
              </button>
            }
          </section>
        </app-container>
      }

      @if (years().length > 1) {
        <app-container class="pb-16">
          <section aria-labelledby="years-title">
            <h2 id="years-title" class="mb-1 text-2xl font-medium tracking-tight">Year by year</h2>
            <p class="mb-6 text-muted-foreground">Points in every year {{ displayName() }} contributed. Pick a year to see it above.</p>
            <ol class="flex gap-1 sm:gap-2" aria-labelledby="years-title">
              @for (row of yearsOldestFirst(); track row.period) {
                <li class="min-w-0 flex-1">
                  <a
                    [routerLink]="[]"
                    [queryParams]="{ period: row.period }"
                    replaceUrl
                    (click)="scrollToStats()"
                    [hlmTooltip]="row.period + ' · Rank #' + number(row.rank) + ' · ' + points(row.score)"
                    [attr.aria-label]="row.period + ', rank ' + number(row.rank) + ', ' + points(row.score) + (row === yearsOldestFirst()[0] ? ', the first year' : '')"
                    [attr.aria-current]="row.period === period() ? 'true' : null"
                    class="group flex flex-col items-center rounded-md transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <span class="flex h-60 w-full flex-col items-center justify-end border-b border-border">
                      @if (row === yearsOldestFirst()[0] && row !== best()) {
                        <span class="mb-1.5 hidden flex-col items-center whitespace-nowrap text-muted-foreground sm:flex" aria-hidden="true">
                          <ng-icon name="vikingLongship" size="1.75rem" />
                          <span class="brand text-sm">The saga begins</span>
                        </span>
                      }
                      @if (row.period === period() || row === best()) {
                        <span class="mb-1.5 hidden text-center text-xs tabular-nums sm:block" aria-hidden="true">
                          @if (row === best()) {
                            <span class="flex flex-col items-center font-semibold whitespace-nowrap text-[#9A6700] dark:text-[#D29922]">
                              <ng-icon name="vikingHelmet" size="1.75rem" aria-hidden="true" />
                              <span class="brand text-sm">Greatest saga</span>
                            </span>
                          }
                          <span class="block font-semibold">#{{ number(row.rank) }}</span>
                          <span class="block text-muted-foreground">{{ number(row.score) }}</span>
                        </span>
                      }
                      <span
                        class="block w-full max-w-14 rounded-t transition-colors"
                        [class]="yearColumn(row)"
                        [style.height.px]="yearBar(row.score)"
                      ></span>
                    </span>
                    <span class="py-1.5 text-xs tabular-nums" [class]="row.period === period() ? 'font-semibold text-foreground' : 'text-muted-foreground'" aria-hidden="true">
                      <span class="sm:hidden">'{{ row.period.slice(2) }}</span><span class="hidden sm:inline">{{ row.period }}</span>
                    </span>
                  </a>
                </li>
              }
            </ol>
          </section>
        </app-container>
      }
    } @else if (profile.isLoading() && validUsername()) {
      <!-- The shape of the profile below, so nothing jumps when it arrives. -->
      <app-container class="py-8 lg:py-14" aria-busy="true">
        <span class="sr-only">Loading the profile of {{ username() }}</span>
        <div class="grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-5 lg:gap-12" aria-hidden="true">
          <div class="flex flex-col items-start gap-5 lg:col-span-2">
            <div class="flex w-full items-center gap-4 lg:gap-5">
              <div hlmSkeleton class="size-32 shrink-0 rounded-xl sm:size-40"></div>
              <div class="flex flex-1 flex-col gap-2">
                <div hlmSkeleton class="h-9 w-3/4 max-w-72"></div>
                <div hlmSkeleton class="h-5 w-32"></div>
                <div class="flex gap-2 pt-1">
                  @for (i of [1, 2, 3, 4]; track i) { <div hlmSkeleton class="size-7 rounded-md"></div> }
                </div>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <div hlmSkeleton class="h-15 w-32"></div>
              <div class="flex flex-col gap-2">
                <div hlmSkeleton class="h-6 w-24"></div>
                <div hlmSkeleton class="h-4 w-36"></div>
              </div>
            </div>
            <div class="flex w-full flex-col gap-2">
              @for (w of ['w-24', 'w-48', 'w-64']; track w) { <div hlmSkeleton [class]="'h-4 max-w-full ' + w"></div> }
            </div>
            <div class="flex flex-wrap gap-2">
              @for (w of ['w-32', 'w-28', 'w-24']; track w) { <div hlmSkeleton [class]="'h-8 rounded-md ' + w"></div> }
            </div>
          </div>
          <div class="flex flex-col gap-4 lg:col-span-3">
            <div hlmSkeleton class="h-10 w-full max-w-md self-end rounded-lg"></div>
            <div class="grid grid-cols-2 gap-4">
              @for (i of [1, 2, 3, 4]; track i) { <div hlmSkeleton class="min-h-40 rounded-xl"></div> }
            </div>
          </div>
        </div>
        <div class="mt-14 flex flex-col gap-3" aria-hidden="true">
          <div hlmSkeleton class="h-7 w-48"></div>
          <div hlmSkeleton class="h-5 w-80 max-w-full"></div>
          <div class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            @for (i of [1, 2, 3, 4, 5, 6]; track i) { <div hlmSkeleton class="h-[4.5rem] rounded-xl"></div> }
          </div>
        </div>
      </app-container>
    } @else {
      <app-container class="py-14">
        <h1 class="text-3xl font-bold tracking-tight">No contributions from {{ username() }}</h1>
        <p class="mt-2 max-w-xl text-muted-foreground">
          {{ notFoundText() }}
        </p>
        <a hlmBtn class="mt-6" href="https://github.com/angular/angular/contribute" target="_blank" rel="noopener">Find a first issue</a>
      </app-container>
    }
  `,
})
export default class Profile {
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly response = injectResponse();
  private readonly auth = inject(AuthService);

  protected readonly username = injectParams(params => String(params['username'] ?? ''));
  private readonly requested = injectQueryParams(params => (isPeriod(params['period']) ? (params['period'] as Period) : null));
  /** Every period is in the profile: switching period needs no request. */
  protected readonly profile = injectServerFn(getContributor, () => ({ username: this.username() }));
  /** Signed in as this contributor (by GitHub id). */
  /** In the class, not the template: an apostrophe in a template string ends it. */
  /** GitHub's rule for a username; anything else is not found, not a failed load. */
  protected readonly validUsername = computed(() => GITHUB_USERNAME_RE.test(this.username()));
  protected readonly notFoundText = computed(() => this.profile.error() && this.validUsername()
    ? 'The profile could not be loaded. Try again in a moment.'
    : "Nobody with this GitHub username has a merged pull request, an issue or a comment in Angular's repositories yet, or the data has not caught up: it updates every night.");
  private readonly promptClosed = signal(false);
  protected closePrompt(): void {
    this.promptClosed.set(true);
  }
  protected readonly signedOut = computed(() => {
    const state = this.auth.state();
    return !!state?.enabled && !state.user && !this.promptClosed();
  });
  protected readonly isAngularian = computed(() => {
    const person = this.profile.value();
    return !!person && !!(person.pullRequests.all || person.helpfulIssues || person.helpfulComments);
  });
  protected readonly signInUrl = (username: string) => this.auth.loginUrl(`/${encodeURIComponent(username)}`);
  protected readonly isOwner = computed(() => {
    const me = this.auth.state()?.user;
    return !!me && me.githubId === this.profile.value()?.githubId;
  });

  protected readonly available = computed(() => this.profile.value()?.periods.map(row => row.period) ?? ['all']);
  /** `?period=` when the contributor contributed in it, all time otherwise. */
  protected readonly period = computed<Period>(() => {
    const requested = this.requested();
    return requested && this.available().includes(requested) ? requested : 'all';
  });
  protected readonly current = computed(() => {
    const person = this.profile.value()!;
    return person.periods.find(row => row.period === this.period()) ?? { ...person, period: 'all' };
  });
  /** One card per kind of contribution; the ones GitHub can search link to that search. */
  protected readonly stats = computed(() => {
    const person = this.profile.value()!;
    const n = this.current();
    const prs = n.pullRequests;
    const search = (q: string, type: 'pullrequests' | 'issues') => `https://github.com/search?${new URLSearchParams({ q: `${reposQuery()} ${q}`, type })}`;
    return [
      {
        key: 'pullRequests', icon: 'octGitMerge', value: prs.all, name: prs.all === 1 ? 'Merged PR' : 'Merged PRs',
        detail: `${formatNumber(prs.feat)} feat · ${formatNumber(prs.fix)} fix · ${formatNumber(prs.docs)} docs · ${formatNumber(prs.chore)} chore`,
        // GitHub shows most landed PRs as closed (PR Close): this lists all of them, landed or not.
        url: this.githubSearch(person), label: `${this.githubLabel(person)}`,
        tint: 'bg-[#8250DF]/5 ring-[#8250DF] hover:bg-[#8250DF]/10 dark:ring-[#A371F7]', text: 'text-[#8250DF] dark:text-[#A371F7]',
      },
      {
        key: 'issues', icon: 'octIssueOpened', value: n.issues, name: n.issues === 1 ? 'Issue' : 'Issues', detail: `${formatNumber(n.helpfulIssues)} helpful`,
        url: search(`is:issue author:${person.username}`, 'issues'), label: `${plural(n.issues, 'issue', 'issues')} ${periodPhrase(this.period())}. Opens ${person.username}'s issues on GitHub`,
        tint: 'bg-[#1A7F37]/5 ring-[#1A7F37] hover:bg-[#1A7F37]/10 dark:ring-[#3FB950]', text: 'text-[#1A7F37] dark:text-[#3FB950]',
      },
      {
        key: 'comments', icon: 'octComment', value: n.comments, name: n.comments === 1 ? 'Comment' : 'Comments',
        // Inline review comments score on their own (1 pt each): their count goes with the comments.
        detail: `${formatNumber(n.helpfulComments)} helpful · ${plural(n.reviewComments, 'review comment', 'review comments')} on code`,
        url: search(`commenter:${person.username}`, 'issues'), label: `${plural(n.comments, 'comment', 'comments')} ${periodPhrase(this.period())}. Opens the issues and pull requests ${person.username} commented on, on GitHub`,
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
  protected readonly packages = computed(() => foldPackages(this.profile.value()?.packages ?? []));
  protected readonly shownPackages = computed(() => {
    const packages = this.packages();
    return this.allPackages() ? packages : packages.slice(0, this.PACKAGES_SHOWN);
  });
  protected readonly packageLabel = packageLabel;
  protected readonly icon = packageIcon;
  protected readonly plural = plural;
  protected readonly points = formatPoints;
  /** Earned from the data: the Angular team, the all-time top 10, #1 of a year, 100+ review comments. */
  protected readonly badges = computed(() => {
    const person = this.profile.value();
    if (!person) return [];
    // One colour per kind, the profile's stat colours: gold for a #1, green for the all-time top 10, blue (comments)
    // for reviews. As soft tints, readable in both themes.
    const gold = 'bg-[#9A6700]/10 text-[#9A6700] ring-[#9A6700]/30 dark:bg-[#D29922]/10 dark:text-[#D29922] dark:ring-[#D29922]/30';
    const green = 'bg-[#1A7F37]/10 text-[#1A7F37] ring-[#1A7F37]/30 dark:bg-[#3FB950]/10 dark:text-[#3FB950] dark:ring-[#3FB950]/30';
    const blue = 'bg-[#0969DA]/10 text-[#0969DA] ring-[#0969DA]/30 dark:bg-[#58A6FF]/10 dark:text-[#58A6FF] dark:ring-[#58A6FF]/30';
    const badges: Array<{ label: string, title: string, icon: string, style: string, logo?: string }> = [];
    // The people behind the Angular community tools this site is built on: their project's own logo.
    const tool = TOOL_PEOPLE[person.githubId];
    if (tool) {
      badges.push({ label: `${tool.name} ${tool.role}`, title: `${tool.role === 'creator' ? 'Created' : 'Maintains'} ${tool.name}, which Angularians is built on`, icon: '', logo: tool.logo, style: 'bg-muted/60 text-foreground ring-border' });
    }
    // The gradient Angular logo of the press kit, only to say "member of the Angular team" (the site's mark stays the A).
    if (person.team) badges.push({ label: 'Angular team', title: 'A public member of the Angular organization on GitHub', icon: 'angular', style: 'bg-[#dc087d]/10 text-foreground ring-[#dc087d]/40' });
    // Every year at #1 in one badge: "#1 in 2024–2026", "#1 in 2019, 2024".
    const firsts = this.years().filter(row => row.rank === 1).map(row => Number(row.period)).sort((x, y) => x - y);
    if (firsts.length) {
      badges.push({ label: `#1 in ${yearRanges(firsts)}`, title: `The top Angularian of ${plural(firsts.length, 'year', 'years')}`, icon: 'vikingHelmet', style: gold });
    }
    if (person.rank <= 10) badges.push({ label: 'Top 10 all time', title: `#${formatNumber(person.rank)} of all time`, icon: 'vikingShield', style: green });
    if (person.reviewComments >= 100) badges.push({ label: 'Reviewer', title: `${formatNumber(person.reviewComments)} review comments on code`, icon: 'vikingAxes', style: blue });
    return badges;
  });
  /** The contributor's rank in each period they contributed in, for the period tabs. */
  protected readonly ranks = computed(() => Object.fromEntries((this.profile.value()?.periods ?? []).map(row => [row.period, row.rank])));
  /** Gold for the best year, solid when it is the one on screen; the others in the brand's green. */
  protected readonly yearColumn = (row: { period: string }) => {
    const picked = row.period === this.period();
    if (row === this.best()) return picked ? 'bg-[#9A6700] dark:bg-[#D29922]' : 'bg-[#9A6700]/60 group-hover:bg-[#9A6700] dark:bg-[#D29922]/60 dark:group-hover:bg-[#D29922]';
    return picked ? 'bg-primary' : 'bg-primary/40 group-hover:bg-primary/70';
  };
  protected readonly yearsOldestFirst = computed(() => [...this.years()].sort((a, b) => Number(a.period) - Number(b.period)));
  protected readonly peakYear = computed(() => this.years().reduce<ReturnType<typeof this.years>[number] | undefined>((top, row) => (!top || row.score > top.score ? row : top), undefined));
  /** A year's column, in pixels: its points against the year with the most, under room for the labels. */
  protected readonly yearBar = (score: number) => Math.max(4, score / Math.max(1, this.peakYear()?.score ?? 1) * 180);
  protected readonly years = computed(() => (this.profile.value()?.periods ?? []).filter(row => /^\d{4}$/.test(row.period)));
  /** Best rank; on a tie (#1 several years), the year with the most points. */
  protected readonly best = computed(() => this.years().reduce<ReturnType<typeof this.years>[number] | undefined>(
    (top, row) => (!top || row.rank < top.rank || (row.rank === top.rank && row.score > top.score) ? row : top), undefined));
  protected readonly displayName = computed(() => this.profile.value()?.name || this.profile.value()?.username || this.username());
  protected readonly since = computed(() => {
    const date = this.profile.value()?.firstContributionAt;
    return date ? SINCE.format(new Date(date)) : null;
  });
  protected readonly links = computed(() => {
    const person = this.profile.value();
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

  protected readonly avatar = (person: ContributorProfile) => avatarUrl(person.githubId, 320);
  protected readonly number = formatNumber;
  protected readonly phrase = periodPhrase;
  protected readonly country = countryName;
  protected readonly flag = flagUrl;
  protected readonly countryQuery = (code: string) => ({ ...profileQuery(this.period()), country: code });

  constructor() {
    effect(() => {
      const person = this.profile.value();
      // Nobody with this username, or a path that cannot be one (`/-x-`): not found.
      if ((person === null || !this.validUsername()) && this.response) this.response.statusCode = 404;
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

  protected githubSearch(person: ContributorProfile): string {
    return `https://github.com/search?${new URLSearchParams({ q: `${reposQuery()} is:pr author:${person.username}`, type: 'pullrequests' })}`;
  }

  protected githubLabel(person: ContributorProfile): string {
    const count = this.current().pullRequests.all;
    return `${plural(count, 'merged pull request', 'merged pull requests')} ${periodPhrase(this.period())}. Opens ${person.username}'s pull requests on GitHub`;
  }

  /** Shared links show the period on screen; the canonical URL has none, so search engines see one page per profile. */
  private updateHead(person: ContributorProfile | null): void {
    if (!person) {
      this.title.setTitle(`${this.username()} · Angularians`);
      this.meta.updateTag({ name: 'robots', content: 'noindex' });
      return;
    }
    const current = this.current();
    const title = this.period() === 'all'
      ? `${person.username}, Angularian #${formatNumber(current.rank)}`
      : `${person.username}: #${formatNumber(current.rank)} ${periodPhrase(this.period())}`;
    const description = `${person.username} merged ${plural(current.pullRequests.all, 'pull request', 'pull requests')}, opened ${plural(current.issues, 'issue', 'issues')} and wrote ${plural(current.comments + current.reviewComments, 'comment', 'comments')} in Angular ${periodPhrase(this.period())}: #${formatNumber(current.rank)} with ${formatPoints(current.score)}.`;
    this.title.setTitle(`${title} · Angularians`);
    this.meta.removeTag('name="robots"');
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    // The Angularian card of the period on screen: 2400×1260, a large preview on X, LinkedIn, Slack…
    const cardQuery = new URLSearchParams({ ...(this.period() === 'all' ? {} : { period: this.period() }), ...(this.cardFlag() ? { flag: this.cardFlag()! } : {}) }).toString();
    const card = `${SITE_URL}/${person.username}/card.png${cardQuery ? `?${cardQuery}` : ''}`;
    this.meta.updateTag({ property: 'og:image', content: card });
    this.meta.updateTag({ property: 'og:image:width', content: '2400' });
    this.meta.updateTag({ property: 'og:image:height', content: '1260' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:image', content: card });
    this.meta.updateTag({ property: 'og:url', content: `${SITE_URL}/${person.username}${this.period() === 'all' ? '' : `?period=${this.period()}`}` });
    setCanonical(this.document, `/${person.username}`);
  }
}
