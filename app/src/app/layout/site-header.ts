import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { remixHeartLine } from '@ng-icons/remixicon';
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
  providers: [provideIcons({ remixHeartLine, simpleGithub })],
  host: { role: 'banner', class: 'sticky top-0 z-40 block border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60' },
  templateUrl: './site-header.html',
})
export class SiteHeader {
  protected readonly auth = inject(AuthService);
  protected readonly signedIn = computed(() => !!this.auth.state()?.user);
}
