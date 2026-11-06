import { afterNextRender, Component, DestroyRef, inject, signal } from '@angular/core'

/** How long Angie stays: she comes in, swings the hammer, the storm plays out, she goes. */
const DURATION = 4000
/** The thunder follows the flash (1.15 s in), a quarter of a second later: the light arrives first. */
const THUNDER = 1400

/**
 * Each click on the word "Angularian(s)", and once a visit the mouse coming onto it after a first click on the page, brings
 * Angie in with her hammer: she calls down lightning somewhere on the page, with thunder.
 */
@Component({
  selector: 'app-hammer-strike',
  host: { 'aria-hidden': 'true' },
  templateUrl: './hammer-strike.html',
  styleUrl: './hammer-strike.css',
})
export class HammerStrike {
  /** The strike on screen: where the bolt lands, and its jagged path from the top of the page. */
  protected readonly strike = signal<{ id: number, main: string, branches: string[], x: number, y: number } | null>(null)

  constructor() {
    const destroyRef = inject(DestroyRef)
    afterNextRender(() => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
      let current: Element | null = null
      let timer: ReturnType<typeof setTimeout> | undefined
      let count = 0
      let woken = false
      const wake = () => { woken = true }
      const storm = () => {
        const x = innerWidth * (0.2 + Math.random() * 0.5)
        const y = innerHeight * (0.35 + Math.random() * 0.35)
        this.strike.set({ id: ++count, ...bolt(x, y), x, y })
        timer = setTimeout(() => this.strike.set(null), DURATION)
        setTimeout(thunder, THUNDER)
      }
      const onOver = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return
        const word = (event.target as Element | null)?.closest?.('.brand') ?? null
        // Once per entry into a word, and not while Angie is still on screen.
        if (word === current) return
        current = word
        // Only after a first click or key on the page: before that the browser would keep the thunder silent.
        if (!word || !woken || this.strike() || hoveredThisVisit()) return
        rememberHover()
        storm()
      }
      // A click on the word strikes too: a click lets the browser play the thunder.
      const onClick = (event: MouseEvent) => {
        if (!(event.target as Element | null)?.closest?.('.brand') || this.strike()) return
        storm()
      }
      document.addEventListener('pointerover', onOver)
      document.addEventListener('click', onClick)
      document.addEventListener('pointerdown', wake, { once: true })
      document.addEventListener('keydown', wake, { once: true })
      destroyRef.onDestroy(() => {
        document.removeEventListener('pointerover', onOver)
        document.removeEventListener('click', onClick)
        document.removeEventListener('pointerdown', wake)
        document.removeEventListener('keydown', wake)
        clearTimeout(timer)
      })
    })
  }
}

const HOVERED = 'angularians-storm-hovered'

/** Hovering calls the storm once a visit (the tab's session); clicking the word calls it any time. */
function hoveredThisVisit(): boolean {
  try {
    return sessionStorage.getItem(HOVERED) === '1'
  }
  catch {
    return false
  }
}

function rememberHover(): void {
  try {
    sessionStorage.setItem(HOVERED, '1')
  }
  catch {
    // Storage blocked: hovering may call it again.
  }
}

/**
 * The thunder recording. Browsers play sound only after the visitor has clicked or typed on the page, so a strike before
 * that is silent.
 */
function thunder(): void {
  const sound = new Audio('/sounds/thunder.mp3')
  sound.volume = 0.6
  sound.play().catch(() => {
    // Not allowed yet: no click or key on the page so far.
  })
}

type Point = [number, number]

/**
 * A storm from the sky down to (x, y): a jagged main channel (midpoint displacement, each split pushed sideways a bit less
 * than the last), long branches forking downward across the page, a few of them forking again, and sometimes a second,
 * fainter bolt elsewhere.
 */
function bolt(x: number, y: number): { main: string, branches: string[] } {
  const channel = jag([x + (Math.random() - 0.5) * innerWidth * 0.3, -20], [x, y], 7, 0.22)
  const branches: string[] = []
  const fork = (points: Point[], count: number, reach: number, again: boolean) => {
    for (let i = 0; i < count; i++) {
      const from = points[Math.floor(points.length * (0.1 + Math.random() * 0.6))]!
      const side = Math.random() < 0.5 ? -1 : 1
      const angle = (25 + Math.random() * 40) * (Math.PI / 180) * side
      const length = Math.max(80, (innerHeight - from[1]) * reach * (0.5 + Math.random() * 0.5))
      const to: Point = [from[0] + Math.sin(angle) * length, from[1] + Math.cos(angle) * length]
      const branch = jag(from, to, 6, 0.28)
      branches.push(path(branch))
      if (again && Math.random() < 0.6) fork(branch, 1 + Math.floor(Math.random() * 2), reach * 0.45, false)
    }
  }
  fork(channel, 4 + Math.floor(Math.random() * 4), 0.75, true)
  if (Math.random() < 0.5) {
    const far = jag([innerWidth * (Math.random() < 0.5 ? 0.1 : 0.85), -20], [innerWidth * (0.05 + Math.random() * 0.9), innerHeight * (0.3 + Math.random() * 0.3)], 6, 0.25)
    branches.push(path(far))
    fork(far, 2, 0.4, false)
  }
  return { main: path(channel), branches }
}

/** The points of a jagged line from a to b: `depth` rounds of splitting, sideways by `roughness` of each segment's length. */
function jag(a: Point, b: Point, depth: number, roughness: number): Point[] {
  let points: Point[] = [a, b]
  for (let round = 0; round < depth; round++) {
    const next: Point[] = [points[0]!]
    for (let i = 1; i < points.length; i++) {
      const [ax, ay] = points[i - 1]!
      const [bx, by] = points[i]!
      const length = Math.hypot(bx - ax, by - ay)
      const shift = (Math.random() - 0.5) * length * roughness * 2
      // Sideways: perpendicular to the segment.
      next.push([(ax + bx) / 2 + (-(by - ay) / length) * shift, (ay + by) / 2 + ((bx - ax) / length) * shift], points[i]!)
    }
    points = next
  }
  return points
}

const path = (points: Point[]) => points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
