// After nuxt.com's `HeaderUserMenu.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs): signed in, the avatar joins the header's GitHub
// link and theme button, and its menu has the profile and signing out.
import { Component, computed, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { remixLogoutBoxRLine } from '@ng-icons/remixicon'
import { HlmPopoverImports } from '@spartan-ng/helm/popover'
import { AuthService } from '../auth/auth.service'
import { AngieService } from './angie.service'
import { LogoMark } from './logo-mark'
import { avatarUrl } from '../contributors/avatar-url'

@Component({
  selector: 'app-user-menu',
  imports: [HlmPopoverImports, LogoMark, NgIcon, RouterLink],
  providers: [provideIcons({ remixLogoutBoxRLine })],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.css',
})
export class UserMenu {
  private readonly auth = inject(AuthService)
  protected readonly angie = inject(AngieService)
  protected readonly user = computed(() => this.auth.state()?.user ?? null)
  protected readonly angieLabel = computed(() => (this.angie.on() ? 'Turn off Angie’s lightning' : 'Turn on Angie’s lightning'))
  protected readonly avatar = (githubId: number) => avatarUrl(githubId, 28)

  /** Following the profile link closes the menu, which would stay open over the new page. */
  protected closeMenu(menu: { close(): void }): void {
    menu.close()
  }
}
