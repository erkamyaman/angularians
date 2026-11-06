import { DOCUMENT, isPlatformBrowser } from "@angular/common";
import { DestroyRef, Directive, ElementRef, PLATFORM_ID, afterNextRender, inject } from "@angular/core";
import {
  BrnTooltip,
  BrnTooltipPosition,
  provideBrnTooltipDefaultOptions,
} from "@spartan-ng/brain/tooltip";
import { hlm } from "@spartan-ng/helm/utils";
import { cva } from "class-variance-authority";

export const DEFAULT_TOOLTIP_SVG_CLASS =
  "bg-foreground fill-foreground z-50 block size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px]";

export const DEFAULT_TOOLTIP_CONTENT_CLASSES = hlm(
  "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 rounded-md px-3 py-1.5 text-xs leading-normal bg-foreground text-background data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit max-w-80 origin-(--radix-tooltip-content-transform-origin)",
);

export const tooltipPositionVariants = cva("absolute", {
  variants: {
    position: {
      top: "bottom-0 left-[calc(50%-5px)] translate-y-full",
      bottom: "-top-2.5 left-[calc(50%-5px)] translate-y-0 rotate-180",
      left: "-end-2.5 top-[calc(50%-5px)] translate-y-0 rotate-270 rtl:-rotate-270",
      right:
        "-start-2.5 top-[calc(50%-5px)] translate-y-0 rotate-90 rtl:-rotate-90",
    },
  },
});

/**
 * Local fixes over the brain tooltip (see THIRD_PARTY_NOTICES.md). It is drawn once, where its trigger was, so:
 * - any scroll closes it (any scroll container, not only the page), and cancels one still waiting for its delay;
 * - a trigger that moves while it is open (a board that swaps, a card that loads) closes it, instead of leaving it
 *   floating away from its trigger;
 * - pressing the trigger closes it (an avatar that navigates must not leave it behind), and a tap on a button opens it;
 * - focus opens it only from the keyboard (`:focus-visible`), not from a click or a dialog giving focus back.
 */
@Directive({
  selector: "[hlmTooltip]",
  exportAs: "hlmTooltip",
  providers: [
    provideBrnTooltipDefaultOptions({
      svgClasses: DEFAULT_TOOLTIP_SVG_CLASS,
      tooltipContentClasses: DEFAULT_TOOLTIP_CONTENT_CLASSES,
      arrowClasses: (position: BrnTooltipPosition) =>
        hlm(tooltipPositionVariants({ position })),
    }),
  ],
  hostDirectives: [
    {
      directive: BrnTooltip,
      inputs: [
        "brnTooltip: hlmTooltip",
        "position",
        "hideDelay",
        "showDelay",
        "sideOffset",
        "tooltipDisabled",
      ],
    },
  ],
})
export class HlmTooltip {
  private readonly brn = inject(BrnTooltip);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);

  constructor() {
    const destroyRef = inject(DestroyRef);
    // Browser only: in this app's server rendering, after-render hooks run on the server too.
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    afterNextRender(() => {
      // The brain's own `delay(false, -1)` (private in its types, @spartan-ng/brain 1.9.0): hide now, and cancel a
      // show still waiting for its delay. It has no public close; check this on an upgrade (tooltip spec).
      const brn = this.brn as unknown as { delay(isShow: boolean, delay?: number): void };
      const close = () => brn.delay(false, -1);
      let tapped = false;
      const view = this.document.defaultView;
      const listeners: Array<[EventTarget, string, EventListener, AddEventListenerOptions]> = [
        [this.document, "scroll", close, { capture: true, passive: true }],
        [view ?? this.document, "resize", close, { passive: true }],
        [this.host, "pointerdown", ((event: PointerEvent) => {
          tapped = event.pointerType === "touch";
          close();
        }) as EventListener, {}],
        // A tap on a button (an info icon) opens it: touch has no hover. After focus, which closes it. Links navigate instead.
        [this.host, "click", () => {
          if (!tapped || !this.host.matches("button")) return;
          brn.delay(true);
          this.document.addEventListener("pointerdown", close, { capture: true, once: true });
        }, {}],
        // After the brain's own focus listener, which shows unconditionally.
        [this.host, "focus", () => queueMicrotask(() => {
          if (!this.host.matches(":focus-visible")) close();
        }), {}],
      ];
      for (const [target, type, listener, options] of listeners) target.addEventListener(type, listener, options);

      // While open, the trigger must stay where the tooltip was drawn: a layout shift closes it.
      let frame = 0;
      const watch = (top: number) => {
        frame = requestAnimationFrame(() => {
          if (Math.abs(this.host.getBoundingClientRect().top - top) > 1) close();
          else watch(top);
        });
      };
      const shown = this.brn.show.subscribe(() => {
        cancelAnimationFrame(frame);
        watch(this.host.getBoundingClientRect().top);
      });
      const hidden = this.brn.hide.subscribe(() => cancelAnimationFrame(frame));

      destroyRef.onDestroy(() => {
        for (const [target, type, listener, options] of listeners) target.removeEventListener(type, listener, options);
        shown.unsubscribe();
        hidden.unsubscribe();
        cancelAnimationFrame(frame);
      });
    });
  }
}
