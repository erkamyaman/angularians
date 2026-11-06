// After nuxt.com's `HeaderUserMenu.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs): signed in, the avatar joins the header's GitHub
// link and theme button, and its menu has the profile and signing out.
import { Component, computed, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { remixLogoutBoxRLine } from '@ng-icons/remixicon'
import { HlmPopoverImports } from '@spartan-ng/helm/popover'
import { AuthService } from '../auth/auth.service'
import { LogoMark } from './logo-mark'
import { avatarUrl } from '../leaderboard/format'

const ITEM = 'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-muted focus-visible:bg-muted'

@Component({
  selector: 'app-user-menu',
  imports: [HlmPopoverImports, LogoMark, NgIcon, RouterLink],
  providers: [provideIcons({ remixLogoutBoxRLine })],
  host: { class: 'flex' },
  templateUrl: './user-menu.html',
})
export class UserMenu {
  private readonly auth = inject(AuthService)
  protected readonly user = computed(() => this.auth.state()?.user ?? null)
  protected readonly item = ITEM
  protected readonly avatar = (githubId: number) => avatarUrl(githubId, 28)
}
