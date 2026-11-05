import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { simpleGithub } from '@ng-icons/simple-icons';
import { HlmButton } from '@spartan-ng/helm/button';
import { AngularLogo } from './angular-logo';
import { Container } from './container';
import { LogoMark } from './logo-mark';

const REPO = 'https://github.com/erkamyaman/angularians';

/** The footer: the brand and its pitch, then the small print. */
@Component({
  selector: 'app-site-footer',
  imports: [AngularLogo, Container, HlmButton, LogoMark, NgIcon, RouterLink],
  providers: [provideIcons({ simpleGithub })],
  host: { role: 'contentinfo', class: 'block border-t' },
  template: `
    <app-container class="block py-10 text-sm">
      <div class="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div class="flex min-w-0 flex-col gap-3">
          <a routerLink="/" class="flex w-fit items-center gap-1">
            <app-logo-mark class="size-8" />
            <span class="brand text-[1.55em] text-brand-from">Angularians</span>
          </a>
          <p class="text-pretty text-muted-foreground">Everyone who has contributed to <span class="ml-0.5 inline-flex items-baseline gap-1 font-medium whitespace-nowrap text-foreground"><app-angular-logo class="size-[1.1em] self-center" />Angular</span>, ranked. Updated every night.</p>
        </div>
        <a hlmBtn variant="outline" class="w-fit shrink-0" [href]="repo" target="_blank" rel="noopener">
          <ng-icon name="simpleGithub" aria-hidden="true" /> Source on GitHub
        </a>
      </div>

      <!-- The Angular community projects this site is built on, with their own logos (THIRD_PARTY_NOTICES.md) -->
      <div class="mt-8 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:gap-5">
        <p class="text-muted-foreground">Built on Angular community tools</p>
        <ul class="flex flex-wrap items-center gap-x-5 gap-y-2">
          @for (tool of tools; track tool.name) {
            <li>
              <a class="inline-flex items-center gap-2 font-medium text-foreground/80 transition-colors hover:text-foreground" [href]="tool.href" target="_blank" rel="noopener" [title]="tool.does">
                @if (tool.logo) {
                  <img [src]="tool.logo" alt="" width="18" height="18" class="size-[18px] shrink-0 object-contain" />
                } @else {
                  <svg viewBox="0 0 128 128" class="size-[18px] shrink-0" aria-hidden="true"><path fill-rule="evenodd" d="M81 36 64 0 47 36l-1 2-9-10a6 6 0 0 0-9 9l10 10h-2L0 64l36 17h2L28 91a6 6 0 1 0 9 9l9-10 1 2 17 36 17-36v-2l9 10a6 6 0 1 0 9-9l-9-9 2-1 36-17-36-17-2-1 9-9a6 6 0 1 0-9-9l-9 10v-2Zm-17 2-2 5c-4 8-11 15-19 19l-5 2 5 2c8 4 15 11 19 19l2 5 2-5c4-8 11-15 19-19l5-2-5-2c-8-4-15-11-19-19l-2-5Z" clip-rule="evenodd" fill="currentColor" /><path d="M118 19a6 6 0 0 0-9-9l-3 3a6 6 0 1 0 9 9l3-3Zm-96 4c-2 2-6 2-9 0l-3-3a6 6 0 1 1 9-9l3 3c3 2 3 6 0 9Zm0 82c-2-2-6-2-9 0l-3 3a6 6 0 1 0 9 9l3-3c3-2 3-6 0-9Zm96 4a6 6 0 0 1-9 9l-3-3a6 6 0 1 1 9-9l3 3Z" fill="currentColor" /></svg>
                }
                {{ tool.name }}
              </a>
            </li>
          }
        </ul>
      </div>

      <div class="mt-6 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>
          © 2026 <a class="font-medium text-foreground transition-opacity hover:opacity-80 " href="https://erkamyaman.dev" target="_blank" rel="noopener">Erkam Yaman</a> ·
          <a class="hover:text-foreground" [href]="repo + '/blob/main/LICENSE'" target="_blank" rel="noopener">MIT licence</a> ·
          Inspired by <a class="hover:text-foreground" href="https://nuxt.com/nuxters" target="_blank" rel="noopener">Nuxters</a> ·
          <a class="hover:text-foreground" [href]="repo + '/blob/main/THIRD_PARTY_NOTICES.md'" target="_blank" rel="noopener">Credits</a>
        </p>
        <p>Community project, not affiliated with Google or the Angular team. Angular is a trademark of Google LLC.</p>
      </div>
    </app-container>
  `,
})
export class SiteFooter {
  protected readonly repo = REPO;
  /** No `logo`: ngxtension's, drawn inline in the text colour (its file has none). */
  protected readonly tools: Array<{ name: string, href: string, does: string, logo?: string }> = [
    { name: 'AnalogJS', href: 'https://analogjs.org', does: 'The meta-framework: pages, server rendering, the API', logo: '/credits/analogjs.svg' },
    { name: 'spartan/ui', href: 'https://spartan.ng', does: 'The UI components', logo: '/credits/spartan.svg' },
    { name: 'ng-icons', href: 'https://ng-icons.github.io/ng-icons', does: 'The icons', logo: '/credits/ng-icons.svg' },
    { name: 'ngxtension', href: 'https://ngxtension.dev', does: 'Signal utilities', },
  ];
}
