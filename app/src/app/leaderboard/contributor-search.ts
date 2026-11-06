// Ported from nuxt.com `app/components/nuxters/NuxtersSearch.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
import { DOCUMENT } from '@angular/common'
import { Component, computed, DestroyRef, effect, ElementRef, inject, input, signal, viewChild } from '@angular/core'
import { Router } from '@angular/router'
import { injectServerFnMutation } from '@analogjs/router'
import { countryName, type ContributorSummary, type Period } from '@angularians/shared'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { remixCloseLine } from '@ng-icons/remixicon'
import { HlmAutocompleteImports } from '@spartan-ng/helm/autocomplete'
import { HlmKbd } from '@spartan-ng/helm/kbd'
import { searchContributors } from '../data/contributors.server'
import { avatarUrl, formatNumber, formatPoints, profileQuery } from './format'

const DEBOUNCE_MS = 200

/** Search everyone, all time, in the selected country if there is one. Nothing loads until you type; `/` focuses it. */
@Component({
  selector: 'app-contributor-search',
  imports: [HlmAutocompleteImports, HlmKbd, NgIcon],
  providers: [provideIcons({ remixCloseLine })],
  templateUrl: './contributor-search.html',
})
export class ContributorSearch {
  /** The profile opens on this period. */
  readonly period = input.required<Period>()
  readonly country = input<string | null>(null)

  private readonly router = inject(Router)
  private readonly document = inject(DOCUMENT)
  private readonly search = injectServerFnMutation(searchContributors)
  private readonly input = viewChild('input', { read: ElementRef })

  protected readonly inputId = 'contributor-search'
  protected readonly term = signal('')
  protected readonly results = signal<ContributorSummary[]>([])
  protected readonly loading = signal(false)
  protected readonly nobodyFound = computed(() => {
    const country = this.country()
    return country ? `Nobody found in ${countryName(country)}` : 'Nobody found'
  })
  protected readonly username = (item: ContributorSummary | null) => item?.username ?? ''
  protected readonly avatar = (item: ContributorSummary) => avatarUrl(item.githubId, 24)
  protected readonly rank = (item: ContributorSummary) => formatNumber(item.rank)
  protected readonly points = (item: ContributorSummary) => formatPoints(item.score)

  private request = 0

  constructor() {
    // Results of another country are never left to pick while the new ones load.
    effect(() => {
      this.country()
      this.results.set([])
    })

    // One request per pause in typing; a slower, older answer never replaces a newer one.
    effect((onCleanup) => {
      const query = this.term().trim()
      const country = this.country()
      const current = ++this.request
      if (!query) {
        this.results.set([])
        this.loading.set(false)
        return
      }
      this.loading.set(true)
      const timer = setTimeout(async () => {
        // On an error, no results rather than stale ones.
        const items = await this.search({ q: query, country }).catch(() => [])
        if (current !== this.request) return
        this.results.set(items)
        this.loading.set(false)
      }, DEBOUNCE_MS)
      onCleanup(() => clearTimeout(timer))
    })

    const onKeydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing = target?.closest('input, textarea, select, [contenteditable="true"]')
      if (event.key !== '/' || typing || event.metaKey || event.ctrlKey || event.altKey) return
      event.preventDefault()
      this.input()?.nativeElement.querySelector('input')?.focus()
    }
    this.document.addEventListener('keydown', onKeydown)
    inject(DestroyRef).onDestroy(() => this.document.removeEventListener('keydown', onKeydown))
  }

  protected clear(): void {
    this.term.set('')
    this.input()?.nativeElement.querySelector('input')?.focus()
  }

  protected open(item: unknown): void {
    if (!item || typeof item !== 'object' || !('username' in item)) return
    const { username } = item as ContributorSummary
    this.term.set('')
    this.results.set([])
    void this.router.navigate(['/', username], { queryParams: profileQuery(this.period(), this.country()) })
  }
}
