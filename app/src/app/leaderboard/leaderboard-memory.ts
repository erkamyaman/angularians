import { Service, signal } from '@angular/core'
import type { ContributorSummary, LeaderboardPage } from '@angularians/shared'

/** How many contributors the board shows at first, and how many more each "Show more" adds: a page on wider screens, fewer on phones. */
export const STEP = { wide: 100, phone: 50 }

/** The pages loaded after the first, and how many of the loaded ones are on screen, wide and on a phone. */
export type ShowMoreState = { more: ContributorSummary[], wide: number, phone: number }

/** One more "Show more": a step more on screen, on a phone or wider. The loaded pages stay as they are. */
export function showOneMore(state: ShowMoreState, phone: boolean): ShowMoreState {
  return phone ? { ...state, phone: state.phone + STEP.phone } : { ...state, wide: state.wide + STEP.wide }
}

/** The extra pages of each board, for as long as the tab is open: a board is its period, country and data night. */
@Service()
export class LeaderboardMemory {
  readonly view = signal<'grid' | 'list'>('grid')

  private readonly pages = new Map<string, ShowMoreState>()

  get(page: LeaderboardPage): ShowMoreState {
    return this.pages.get(this.key(page)) ?? { more: [], wide: STEP.wide, phone: STEP.phone }
  }

  set(page: LeaderboardPage, shown: ShowMoreState): void {
    this.pages.set(this.key(page), shown)
  }

  private key(page: LeaderboardPage): string {
    return `${page.period}|${page.country ?? ''}|${page.collectedAt ?? ''}`
  }
}
