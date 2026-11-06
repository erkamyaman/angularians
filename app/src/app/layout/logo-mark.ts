import { afterNextRender, booleanAttribute, Component, ElementRef, inject, input, linkedSignal } from '@angular/core';

let introPlayed = false;

/**
 * The Angularians mark: the Angular shield cut in two along the right leg of a rough-cut A (the capital A of
 * Norse Bold). The left piece holds the A, which cuts through the shield from its tip out through its bottom; the
 * right piece is a contribution graph, in golds and the grey of empty days. Built by `app/scripts/logo/build.py`;
 * its colours are the theme's (`--color-brand-from`, `--mark-*` in styles.css). Lifted 3.5%: the bright A half hangs
 * lower than the grid, so next to a word the eye centres on it, not on the box (0.85 of 24 units).
 *
 * `compact`: for small sizes (badges), where the theme's dark golds and grey would vanish into a tinted background:
 * the graph in shades of the text's colour (`currentColor`), faint for empty days, full for the busiest.
 */
@Component({
  selector: 'app-logo-mark',
  host: { class: 'inline-block', '[class.compact]': 'compact()', '[class.intro]': 'playing()', '(animationend)': 'introEnded()' },
  styleUrl: './logo-mark.css',
  templateUrl: './logo-mark.html',
})
export class LogoMark {
  readonly compact = input(false, { transform: booleanAttribute });
  readonly intro = input(false, { transform: booleanAttribute });
  private readonly firstLoad = !introPlayed;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly playing = linkedSignal(() => this.intro() && this.firstLoad);

  constructor() {
    afterNextRender(() => {
      if (this.intro()) introPlayed = true;
    });
  }

  protected introEnded(): void {
    if (!this.host.getAnimations({ subtree: true }).some(animation => animation.playState === 'running')) this.playing.set(false);
  }
}
