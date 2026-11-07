import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { remixHeartLine, remixLoginBoxLine } from '@ng-icons/remixicon';
import { simpleGithub } from '@ng-icons/simple-icons';
import { HlmButton } from '@spartan-ng/helm/button';
import { Container } from './container';
import { LogoMark } from './logo-mark';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-site-header',
  imports: [Container, HlmButton, LogoMark, NgIcon, RouterLink, ThemeToggle, UserMenu],
  providers: [provideIcons({ remixHeartLine, remixLoginBoxLine, simpleGithub })],
  host: { role: 'banner' },
  templateUrl: './site-header.html',
  styleUrl: './site-header.css',
})
export class SiteHeader {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly url = toSignal(this.router.events.pipe(filter(event => event instanceof NavigationEnd), map(() => this.router.url)), { initialValue: this.router.url });

  protected readonly signedIn = computed(() => !!this.auth.state()?.user);
  /** Signed in, or last time (the hint): the avatar's place. */
  protected readonly avatarSlot = computed(() => this.signedIn() || this.auth.wasSignedIn());
  /** Signed in last time, the session still loading. */
  protected readonly restoringSession = computed(() => this.auth.wasSignedIn() && this.auth.state() === null);
  protected readonly signInEnabled = computed(() => !!this.auth.state()?.enabled);
  /** Sign in, then back to this page. */
  protected readonly loginUrl = computed(() => this.auth.loginUrl(this.url()));
}
