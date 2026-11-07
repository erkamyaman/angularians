import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { simpleGithub } from '@ng-icons/simple-icons';
import { HlmButton } from '@spartan-ng/helm/button';
import { AngularLogo } from './angular-logo';
import { Container } from './container';
import { scrollHomeToTop } from './home-top';
import { LogoMark } from './logo-mark';
import { REPO_URL } from '../site';

/** The footer: the brand and its pitch, then the small print. */
@Component({
  selector: 'app-site-footer',
  imports: [AngularLogo, Container, HlmButton, LogoMark, NgIcon, RouterLink],
  providers: [provideIcons({ simpleGithub })],
  host: { role: 'contentinfo', id: 'site-footer' },
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.css',
})
export class SiteFooter {
  private readonly router = inject(Router);
  protected readonly repo = REPO_URL;
  /** The footer's links: the board, how to take part, and the people behind it. */
  protected readonly groups: ReadonlyArray<{ title: string, links: ReadonlyArray<{ label: string, route?: string, fragment?: string, href?: string }> }> = [
    { title: 'The board', links: [
      { label: 'Leaderboard', route: '/', fragment: 'leaderboard' },
      { label: 'Around the world', route: '/', fragment: 'world' },
      { label: 'Built on', route: '/', fragment: 'built-on' },
      { label: 'Claim a badge', route: '/', fragment: 'claim-a-badge' },
    ] },
    { title: 'Take part', links: [
      { label: 'Contributing guide', href: `${REPO_URL}/blob/main/CONTRIBUTING.md` },
      { label: 'Request a badge', href: `${REPO_URL}/issues/new?template=badge-request.yml` },
      { label: 'Report a bug', href: `${REPO_URL}/issues/new?template=bug_report.yml` },
    ] },
    { title: 'People', links: [
      { label: 'Sponsor', href: 'https://github.com/sponsors/erkamyaman' },
      { label: 'Send a raven (ping me)', href: 'https://erkamyaman.dev/links/' },
    ] },
  ];

  protected toTop(): void {
    scrollHomeToTop(this.router.url);
  }
}
