import { afterNextRender, Component, computed, signal } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { remixStarFill } from '@ng-icons/remixicon'
import { simpleGithub } from '@ng-icons/simple-icons'
import { HlmButton } from '@spartan-ng/helm/button'
import { REPO_URL } from '../site'
import { formatNumber } from '../text/number-format'
import { plural } from '../text/plural'

export const STARS_KEY = 'angularians-repo-stars'
const API_URL = REPO_URL.replace('https://github.com/', 'https://api.github.com/repos/')

@Component({
  selector: 'app-github-stars',
  imports: [HlmButton, NgIcon],
  providers: [provideIcons({ remixStarFill, simpleGithub })],
  templateUrl: './github-stars.html',
  styleUrl: './github-stars.css',
})
export class GithubStars {
  private readonly count = signal<number | null>(null)
  protected readonly repoUrl = REPO_URL
  protected readonly stars = computed(() => {
    const count = this.count()
    return count === null ? null : formatNumber(count)
  })
  protected readonly label = computed(() => {
    const count = this.count()
    return count === null ? 'Angularians on GitHub' : `Angularians on GitHub, ${plural(count, 'star', 'stars')}`
  })

  constructor() {
    afterNextRender(() => void this.loadCount())
  }

  private async loadCount(): Promise<void> {
    const remembered = this.rememberedCount()
    if (remembered !== null) {
      this.count.set(remembered)
      return
    }
    try {
      const response = await fetch(API_URL)
      if (!response.ok) return
      const { stargazers_count: count } = await response.json() as { stargazers_count?: unknown }
      if (typeof count !== 'number') return
      this.count.set(count)
      sessionStorage.setItem(STARS_KEY, String(count))
    }
    catch {
      // No count: the link still works.
    }
  }

  private rememberedCount(): number | null {
    try {
      const saved = sessionStorage.getItem(STARS_KEY)
      return saved && Number.isFinite(Number(saved)) ? Number(saved) : null
    }
    catch {
      return null
    }
  }
}
