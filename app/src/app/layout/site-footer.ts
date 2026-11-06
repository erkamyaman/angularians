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
  templateUrl: './site-footer.html',
})
export class SiteFooter {
  protected readonly repo = REPO;
}
