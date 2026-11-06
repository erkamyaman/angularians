// Ported from nuxt.com `app/components/nuxters/NuxtersGlobe.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs).
// Browser only: it is rendered inside `@defer`, and its WebGL setup runs in `afterNextRender`.
import {
  afterNextRender, Component, computed, DestroyRef, effect, ElementRef, inject, input, output, signal, untracked, viewChild,
} from '@angular/core';
import { COUNTRIES, type CountryStats } from '@angularians/shared';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { remixAddLine, remixPauseLine, remixPlayLine, remixRestartLine, remixSubtractLine } from '@ng-icons/remixicon';
import { HlmButton } from '@spartan-ng/helm/button';
import type { Globe as CobeGlobe } from 'cobe';
import createGlobe from 'cobe';
import { flagUrl, formatNumber, plural } from '../leaderboard/format';
import { ThemeService } from '../theme.service';
import { vikingLongship } from '../layout/viking-icons';
import { faceOnGlobe, projectOnGlobe } from './globe-math';

/** Opens on the Atlantic: Europe and the Americas, where most contributors are. */
const DEFAULT_CAMERA = { ...faceOnGlobe([20, -30]), zoom: 1 };
const MAX_ZOOM = 3;
/** Zoomed in, countries show their best ranked contributors instead of a count. */
const AVATAR_ZOOM = 1.6;
/** Zoomed in, the globe outgrows the canvas and fades out from 82% of the radius: markers stay inside. */
const FRAME = 0.88;
/** Longships on open water, latitude and longitude: the Atlantic, the Pacific and the Indian Ocean. */
const SHIPS: ReadonlyArray<readonly [number, number]> = [[42, -40], [8, -32], [-32, -18], [20, -145], [-22, -120], [32, 165], [-25, 78], [8, 65]];
const SAIL_MS = 36000;
const SAIL_DEGREES = 11;
const MARKER_WIDTH: Record<string, number> = { base: 20, mid: 22, top: 26 };
const KEY_MOVES: Record<string, [number, number]> = { ArrowLeft: [-0.15, 0], ArrowRight: [0.15, 0], ArrowUp: [0, -0.15], ArrowDown: [0, 0.15] };

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const angleDelta = (from: number, to: number) => ((to - from + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
/** The theme's primary colour as WebGL wants it: both themes recolour the land through it. */
const primaryColor = (fallback: [number, number, number]): [number, number, number] => {
  const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const value = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
  if (!context || !value) return fallback;
  context.fillStyle = value;
  context.fillRect(0, 0, 1, 1);
  const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
  return [red / 255, green / 255, blue / 255];
};
const palette = (dark: boolean) => dark
  ? { dark: 1, diffuse: 1.2, mapBrightness: 4, mapBaseBrightness: 0.03, baseColor: primaryColor([0.44, 0.69, 0.48]).map(channel => channel * 0.6) as [number, number, number], glowColor: [0.06, 0.08, 0.1] as [number, number, number] }
  : { dark: 0, diffuse: 1.4, mapBrightness: 8, mapBaseBrightness: 0, baseColor: [0.94, 0.95, 0.96] as [number, number, number], glowColor: [0.92, 0.93, 0.95] as [number, number, number] };

interface GlobeMarker extends CountryStats {
  name: string
  location: readonly [number, number]
}

@Component({
  selector: 'app-globe',
  imports: [HlmButton, NgIcon],
  providers: [provideIcons({ vikingLongship, remixSubtractLine, remixPauseLine, remixPlayLine, remixAddLine, remixRestartLine })],
  host: { '[attr.data-ready]': 'ready() || null' },
  templateUrl: './globe.html',
  styleUrl: './globe.css',
})
export class Globe {
  readonly countries = input.required<CountryStats[]>();
  /** ISO code of the selected country: the globe turns to it. */
  readonly selected = input<string | null>(null);
  readonly select = output<string | null>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  protected readonly theme = inject(ThemeService);
  protected readonly land = signal<[number, number, number]>([0.44, 0.69, 0.48]);

  protected readonly MAX_ZOOM = MAX_ZOOM;
  protected readonly SHIPS = SHIPS;
  protected readonly failed = signal(false);
  protected readonly ready = signal(false);
  protected readonly paused = signal(false);
  protected readonly zoom = signal(1);
  protected readonly avatars = computed(() => this.zoom() >= AVATAR_ZOOM);
  protected readonly markers = computed<GlobeMarker[]>(() => this.countries()
    .flatMap((country) => {
      const known = COUNTRIES[country.code];
      return known?.location ? [{ ...country, name: known.name, location: known.location }] : [];
    })
    // The selected country first: it keeps its marker when others overlap it.
    .sort((a, b) => Number(b.code === this.selected()) - Number(a.code === this.selected()) || b.count - a.count));

  protected readonly hovered = signal<string | null>(null);
  private readonly topCount = computed(() => Math.max(1, ...this.countries().map(country => country.count)));
  protected readonly tier = (count: number) => count >= this.topCount() * 0.25 ? 'top' : count >= this.topCount() * 0.05 ? 'mid' : 'base';
  protected readonly flag = flagUrl;
  protected readonly number = formatNumber;
  protected readonly count = (value: number) => plural(value, 'Angularian', 'Angularians');
  protected readonly avatar = (username: string) => `https://avatars.githubusercontent.com/${encodeURIComponent(username)}?s=64`;

  // WebGL and the frame-by-frame camera stay local: none of it is state to share or render.
  private globe: CobeGlobe | undefined;
  private frame = 0;
  private sailTime = 0;
  private readonly reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private lastTime = 0;
  private running = false;
  private resized = true;
  private width = 1;
  private height = 1;
  private onScreen = false;
  private tabVisible = true;
  private still = false;
  private readonly camera = { ...DEFAULT_CAMERA };
  private phi = DEFAULT_CAMERA.phi;
  private theta = DEFAULT_CAMERA.theta;
  private currentZoom = DEFAULT_CAMERA.zoom;
  private readonly pointers = new Map<number, { x: number, y: number }>();
  private pinchDistance = 0;
  private readonly projection = { depth: 0, x: 0, y: 0 };

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const element = this.host.nativeElement as HTMLElement;
      const canvas = this.canvas().nativeElement;
      try {
        if (!canvas.getContext('webgl2') && !canvas.getContext('webgl')) throw new Error('WebGL unavailable');
        this.globe = createGlobe(canvas, {
          width: 1,
          height: 1,
          devicePixelRatio: Math.min(devicePixelRatio || 1, innerWidth < 768 ? 1.5 : 2),
          phi: this.phi,
          theta: this.theta,
          scale: 0.98,
          mapSamples: 32000,
          markerColor: [0.9, 0.1, 0.35],
          markers: [],
          ...palette(this.theme.dark()),
        });
      }
      catch {
        this.failed.set(true);
        return;
      }

      // Frames run only while the globe is on screen, in a visible tab, and moving.
      const resize = new ResizeObserver(([entry]) => {
        this.width = Math.max(1, Math.round(entry!.contentRect.width));
        this.height = Math.max(1, Math.round(entry!.contentRect.height));
        this.resized = true;
        this.schedule();
      });
      resize.observe(element);
      const visibility = new IntersectionObserver(([entry]) => {
        this.onScreen = !!entry?.isIntersecting;
        if (this.onScreen) this.schedule();
        else this.pause();
      });
      visibility.observe(element);
      const onVisibility = () => {
        this.tabVisible = document.visibilityState === 'visible';
        if (!this.tabVisible) this.pointers.clear();
        if (this.tabVisible) this.schedule();
        else this.pause();
      };
      document.addEventListener('visibilitychange', onVisibility);
      const motion = matchMedia('(prefers-reduced-motion: reduce)');
      const onMotion = () => {
        this.still = motion.matches;
        this.schedule();
      };
      onMotion();
      motion.addEventListener('change', onMotion);
      // Trackpad pinch is a Ctrl+wheel: a plain wheel keeps scrolling the page.
      const onWheel = (event: WheelEvent) => {
        if (!event.ctrlKey) return;
        event.preventDefault();
        const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? this.height : 1);
        this.setZoom(this.camera.zoom * Math.exp(-delta * 0.01));
      };
      element.addEventListener('wheel', onWheel, { passive: false });

      destroyRef.onDestroy(() => {
        this.pause();
        resize.disconnect();
        visibility.disconnect();
        document.removeEventListener('visibilitychange', onVisibility);
        motion.removeEventListener('change', onMotion);
        element.removeEventListener('wheel', onWheel);
        this.globe?.destroy();
        this.globe = undefined;
      });

      this.ready.set(true);
      this.focusSelected();
      this.schedule();
    });

    // A new selection turns the globe to it; new markers, zoom or pause need a frame.
    effect(() => {
      this.selected();
      untracked(() => this.focusSelected());
    });
    effect(() => {
      this.markers();
      this.paused();
      this.avatars();
      this.hovered();
      // After the markers render: positions are written to the new elements.
      untracked(() => queueMicrotask(() => this.schedule()));
    });
    effect(() => {
      const colors = palette(this.theme.dark());
      untracked(() => {
        this.land.set(primaryColor(this.land()));
        this.globe?.update(colors);
        this.schedule();
      });
    });
    // The theme toggle switches the `dark` class on the root element.
    const recolour = new MutationObserver(() => {
      this.land.set(primaryColor(this.land()));
      this.globe?.update(palette(this.theme.dark()));
      this.schedule();
    });
    recolour.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    inject(DestroyRef).onDestroy(() => recolour.disconnect());
  }

  private schedule(): void {
    if (!this.globe || !this.onScreen || !this.tabVisible || this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    const tick = (time: number) => {
      if (!this.running) return;
      const elapsed = Math.min(time - this.lastTime, 64);
      this.lastTime = time;
      this.render(elapsed);
      if (this.running) this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  private pause(): void {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }

  private render(elapsed: number): void {
    const { width, height } = this;
    const rotating = !this.paused() && !this.pointers.size && !this.still && !this.hovered();
    if (rotating) this.camera.phi += elapsed * 0.00006;
    const progress = this.still || this.pointers.size ? 1 : 1 - Math.exp(-elapsed / 110);
    this.phi += angleDelta(this.phi, this.camera.phi) * progress;
    this.theta += (this.camera.theta - this.theta) * progress;
    this.currentZoom += (this.camera.zoom - this.currentZoom) * progress;
    const scale = Math.min(width, height) / height * 0.98 * this.currentZoom;
    this.globe?.update({ phi: this.phi, theta: this.theta, scale, ...(this.resized ? { width, height } : {}) });
    this.resized = false;

    // Markers are HTML on top of the canvas: hide the ones behind the globe, out of the frame, or over another.
    const element = this.host.nativeElement as HTMLElement;
    const occupied: Array<{ x: number, y: number, width: number }> = [];
    const frame = Math.min(width, height) / 2 * FRAME;
    const avatars = this.avatars();
    const markerHeight = avatars ? 32 : 28;
    for (const country of this.markers()) {
      const marker = element.querySelector<HTMLElement>(`.globe__marker[data-code="${country.code}"]`);
      if (!marker) continue;
      projectOnGlobe(this.projection, country.location, this.phi, this.theta, scale);
      const x = width / 2 + this.projection.x * height / 2;
      const y = height / 2 + this.projection.y * height / 2;
      const markerWidth = avatars
        ? (country.code === this.selected() ? 32 + (country.top.length - 1) * 24 : 32)
        : MARKER_WIDTH[this.tier(country.count)] + formatNumber(country.count).length * (this.tier(country.count) === 'base' ? 7 : 8);
      const wasVisible = marker.dataset['visible'] === 'true';
      const front = this.projection.depth > (wasVisible ? 0.1 : 0.14);
      const fits = Math.hypot(x - width / 2, y - height / 2) < frame - Math.max(markerWidth, markerHeight) / 2;
      const gap = wasVisible ? 4 : 8;
      const hasRoom = occupied.every(other => Math.abs(other.x - x) > (other.width + markerWidth) / 2 + gap || Math.abs(other.y - y) > 28 + gap);
      const show = front && fits && hasRoom;
      if (show !== wasVisible) {
        marker.dataset['visible'] = String(show);
        marker.inert = !show;
      }
      if (show || wasVisible) {
        // Sub-pixel, like the globe under it: whole pixels made the markers step while it turned smoothly.
        const transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
        if (marker.style.transform !== transform) marker.style.transform = transform;
      }
      if (show) occupied.push({ x, y, width: markerWidth });
    }
    if (rotating && !this.reducedMotion) this.sailTime += elapsed;
    SHIPS.forEach(([latitude, longitude], index) => {
      const ship = element.querySelector<HTMLElement>(`.globe__ship[data-ship="${index}"]`);
      if (!ship) return;
      // Back and forth on open water, each on its own course. It turns around at the ends.
      const course = this.sailTime / SAIL_MS * Math.PI * 2 + index * 1.7;
      projectOnGlobe(this.projection, [latitude + Math.cos(course) * 3, longitude + Math.sin(course) * SAIL_DEGREES], this.phi, this.theta, scale);
      const x = width / 2 + this.projection.x * height / 2;
      const y = height / 2 + this.projection.y * height / 2;
      const show = this.projection.depth > 0.14 && Math.hypot(x - width / 2, y - height / 2) < frame - 14;
      ship.dataset['visible'] = String(show);
      if (show) ship.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) scaleX(${Math.cos(course) < 0 ? -1 : 1})`;
    });
    const moving = Math.abs(angleDelta(this.phi, this.camera.phi)) > 0.0001 || Math.abs(this.theta - this.camera.theta) > 0.0001 || Math.abs(this.currentZoom - this.camera.zoom) > 0.0001;
    // Paused and settled: no more frames until something moves.
    if (!rotating && !moving) this.pause();
  }

  protected togglePause(): void {
    this.paused.update(value => !value);
  }

  protected setZoom(value: number): void {
    this.paused.set(true);
    this.zoom.set(clamp(value, 1, MAX_ZOOM));
    this.camera.zoom = this.zoom();
    this.schedule();
  }

  protected reset(): void {
    this.paused.set(false);
    Object.assign(this.camera, DEFAULT_CAMERA);
    this.zoom.set(DEFAULT_CAMERA.zoom);
    this.select.emit(null);
    this.schedule();
  }

  private focusSelected(): void {
    const code = this.selected();
    const location = code ? COUNTRIES[code]?.location : undefined;
    if (!location) return;
    this.paused.set(true);
    Object.assign(this.camera, faceOnGlobe(location), { zoom: Math.max(this.camera.zoom, 1.8) });
    this.zoom.set(this.camera.zoom);
    this.schedule();
  }

  private pinch(): number {
    const [first, second] = [...this.pointers.values()];
    return first && second ? Math.hypot(first.x - second.x, first.y - second.y) : 0;
  }

  protected pointerDown(event: PointerEvent): void {
    this.paused.set(true);
    this.canvas().nativeElement.setPointerCapture(event.pointerId);
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    this.pinchDistance = this.pinch();
  }

  protected pointerMove(event: PointerEvent): void {
    const previous = this.pointers.get(event.pointerId);
    if (!previous) return;
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.pointers.size > 1) {
      const next = this.pinch();
      if (this.pinchDistance > 0) this.setZoom(this.camera.zoom * next / this.pinchDistance);
      this.pinchDistance = next;
      return;
    }
    // Slower when zoomed in: the same drag moves the same distance on screen.
    this.camera.phi += (event.clientX - previous.x) / (180 * this.camera.zoom);
    this.camera.theta = clamp(this.camera.theta + (event.clientY - previous.y) / (240 * this.camera.zoom), -1.45, 1.45);
    this.schedule();
  }

  protected pointerEnd(event: PointerEvent): void {
    this.pointers.delete(event.pointerId);
    const canvas = this.canvas().nativeElement;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    this.pinchDistance = this.pinch();
  }

  protected keydown(event: KeyboardEvent): void {
    const move = KEY_MOVES[event.key];
    if (move) {
      event.preventDefault();
      this.paused.set(true);
      this.camera.phi += move[0];
      this.camera.theta = clamp(this.camera.theta + move[1], -1.45, 1.45);
      this.schedule();
    }
    else if (['+', '=', '-', '0'].includes(event.key)) {
      event.preventDefault();
      if (event.key === '0') this.reset();
      else this.setZoom(this.zoom() + (event.key === '-' ? -0.25 : 0.25));
    }
  }

  protected contextLost(event: Event): void {
    event.preventDefault();
    this.failed.set(true);
    this.pause();
  }
}
