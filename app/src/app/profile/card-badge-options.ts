import { Component, computed, input, model, output } from '@angular/core'
import { HlmButton } from '@spartan-ng/helm/button'
import { HlmSelectImports } from '@spartan-ng/helm/select'
import { badgeKey, cardBadgeLabel, shownBadges, type BadgeNameStyle } from './card-badges'
import type { EarnedBadge } from './earned-badges'

@Component({
  selector: 'app-card-badge-options',
  imports: [HlmButton, HlmSelectImports],
  templateUrl: './card-badge-options.html',
})
export class CardBadgeOptions {
  readonly badges = input.required<readonly EarnedBadge[]>()
  readonly hidden = model<readonly string[]>([])
  readonly names = model<BadgeNameStyle>('fun')
  readonly changed = output<void>()

  protected readonly choices = computed(() => this.badges().map(badge => ({ key: badgeKey(badge.label), label: cardBadgeLabel(badge, this.names()) })))
  private readonly keys = computed(() => this.choices().map(choice => choice.key))
  protected readonly shownKeys = computed(() => this.keys().filter(key => !this.hidden().includes(key)))
  protected readonly noneShown = computed(() => !this.shownKeys().length)
  protected readonly summary = computed(() => {
    if (this.noneShown()) return 'No badges'
    return this.shownKeys().length === this.keys().length ? 'All badges' : `${this.shownKeys().length} of ${this.keys().length} badges`
  })
  protected readonly toggleLabel = computed(() => (this.noneShown() ? 'Show all badges' : 'No badges'))
  protected readonly nameChoices = computed((): ReadonlyArray<{ value: BadgeNameStyle, label: string }> => shownBadges(this.badges(), this.hidden()).some(badge => badge.officialLabel)
    ? [{ value: 'fun', label: 'Fun names' }, { value: 'official', label: 'Official names' }, { value: 'none', label: 'No names' }]
    : [{ value: 'fun', label: 'Names' }, { value: 'none', label: 'No names' }])
  protected readonly choiceLabel = (key: string) => this.choices().find(choice => choice.key === key)?.label ?? key
  protected readonly nameLabel = (value: BadgeNameStyle) => this.nameChoices().find(choice => choice.value === value)?.label ?? ''

  protected pickBadges(keys: readonly string[] | null | undefined): void {
    const shown = keys ?? []
    this.hidden.set(this.keys().filter(key => !shown.includes(key)))
    if (!this.nameChoices().some(choice => choice.value === this.names())) this.names.set('fun')
    this.changed.emit()
  }

  protected toggleNoBadges(): void {
    this.pickBadges(this.noneShown() ? this.keys() : [])
  }

  protected pickNames(value: BadgeNameStyle | null | undefined): void {
    if (!value || value === this.names()) return
    this.names.set(value)
    this.changed.emit()
  }
}
