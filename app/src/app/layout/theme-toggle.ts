import { Component, computed, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { remixMoonLine, remixSunLine } from '@ng-icons/remixicon';
import { HlmButton } from '@spartan-ng/helm/button';
import { ThemeService } from '../theme.service';

/** One button between dark (the default) and light. The icon and label say what a click switches to. */
@Component({
  selector: 'app-theme-toggle',
  imports: [HlmButton, NgIcon],
  providers: [provideIcons({ remixMoonLine, remixSunLine })],
  templateUrl: './theme-toggle.html',
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeService)
  protected readonly label = computed(() => (this.theme.dark() ? 'Switch to the light theme' : 'Switch to the dark theme'))
}
