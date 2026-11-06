// Ported from nuxt.com `app/components/nuxters/NuxtersCountrySelect.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
import { Component, computed, effect, ElementRef, input, output, untracked, viewChild, viewChildren } from '@angular/core'
import { countryName, type CountryStats } from '@angularians/shared'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { remixArrowDownSLine, remixCheckLine, remixCloseLine, remixEarthLine, remixSearchLine } from '@ng-icons/remixicon'
import { BrnCombobox, BrnComboboxItem } from '@spartan-ng/brain/combobox'
import { provideBrnPopoverConfig } from '@spartan-ng/brain/popover'
import { HlmComboboxImports } from '@spartan-ng/helm/combobox'
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group'
import { flagUrl, formatNumber, matchesCountry, matchesName } from './format'

const ALL = 'all'

/** Everyone, or one country, searchable by name. Countries come from the GitHub profiles; hidden until there are some. */
@Component({
  selector: 'app-country-select',
  imports: [HlmComboboxImports, HlmInputGroupImports, NgIcon],
  providers: [
    provideIcons({ remixCheckLine, remixCloseLine, remixArrowDownSLine, remixEarthLine, remixSearchLine }),
    provideBrnPopoverConfig({ align: 'start', sideOffset: 6 }),
  ],
  templateUrl: './country-select.html',
})
export class CountrySelect {
  readonly countries = input.required<CountryStats[]>()
  readonly value = input<string | null>(null)
  readonly valueChange = output<string | null>()
  readonly allLabel = input('All countries')
  readonly ariaLabel = input('Filter by country')
  readonly showCounts = input(true)

  protected readonly ALL = ALL
  protected readonly flag = flagUrl
  protected readonly items = computed(() => {
    // A country picked in another period keeps showing, with nobody in this one.
    const value = this.value()
    const countries = value && !this.countries().some(item => item.code === value)
      ? [{ code: value, count: 0, top: [] }, ...this.countries()]
      : this.countries()
    return countries.map(item => ({ code: item.code, name: countryName(item.code), count: formatNumber(item.count) }))
  })
  protected readonly label = (code: string | null) => (code && code !== ALL ? countryName(code) : this.allLabel())

  protected readonly matches = (code: string, search: string) =>
    code === ALL ? matchesName(this.label(code), search) : matchesCountry(code, search)

  private readonly combobox = viewChild(BrnCombobox)
  private readonly options = viewChildren(BrnComboboxItem)
  private readonly trigger = viewChild('trigger', { read: ElementRef })

  constructor() {
    effect(() => {
      const combobox = this.combobox()
      if (!combobox?.isExpanded() || combobox.search()) return
      const selected = this.value() ?? ALL
      const option = this.options().find(item => item.value() === selected)
      if (option) untracked(() => combobox.keyManager.setActiveItem(option))
    })
  }

  protected clear(): void {
    this.valueChange.emit(null)
    this.trigger()?.nativeElement.focus()
  }

  protected pick(value: unknown): void {
    const code = typeof value === 'string' && value !== ALL ? value : null
    if (code !== this.value()) this.valueChange.emit(code)
  }
}
