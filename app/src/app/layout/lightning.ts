/** A point on the page, in CSS pixels. */
export type Point = [number, number]

export interface Branch {
  d: string
  level: 1 | 2
  at: number
  span: number
}

/** One strike: where it lands, and its paths (the main channel, then the branches and any second bolt). */
export interface Strike {
  id: number
  x: number
  y: number
  top: number
  main: string
  branches: Branch[]
}

/**
 * A storm from the sky down to (x, y), for a page `width` × `height`: a jagged main channel (midpoint displacement, each
 * split pushed sideways a bit less than the last), long branches forking downward across the page, some forking again,
 * and sometimes a second, fainter bolt elsewhere.
 */
export function lightning(x: number, y: number, width: number, height: number): Pick<Strike, 'top' | 'main' | 'branches'> {
  const top = x + (Math.random() - 0.5) * width * 0.3
  const channel = jag([top, -20], [x, y], 7, 0.22)
  const mainLength = length(channel)
  const branches: Branch[] = []
  const fork = (points: Point[], from: number, span: number, count: number, reach: number, level: 1 | 2) => {
    for (let i = 0; i < count; i++) {
      const index = Math.floor(points.length * (0.1 + Math.random() * 0.6))
      const start = points[index]!
      const side = Math.random() < 0.5 ? -1 : 1
      const angle = (25 + Math.random() * 40) * (Math.PI / 180) * side
      const reachPx = Math.max(80, (height - start[1]) * reach * (0.5 + Math.random() * 0.5))
      const branch = jag(start, [start[0] + Math.sin(angle) * reachPx, start[1] + Math.cos(angle) * reachPx], 6, 0.28)
      const at = from + (index / points.length) * span
      const branchSpan = length(branch) / mainLength
      branches.push({ d: path(branch), level, at, span: branchSpan })
      if (level === 1 && Math.random() < 0.6) fork(branch, at, branchSpan, 1 + Math.floor(Math.random() * 2), reach * 0.45, 2)
    }
  }
  fork(channel, 0, 1, 4 + Math.floor(Math.random() * 4), 0.75, 1)
  if (Math.random() < 0.5) {
    const secondBolt = jag([width * (Math.random() < 0.5 ? 0.1 : 0.85), -20], [width * (0.05 + Math.random() * 0.9), height * (0.3 + Math.random() * 0.3)], 6, 0.25)
    const span = length(secondBolt) / mainLength
    branches.push({ d: path(secondBolt), level: 1, at: 0, span })
    fork(secondBolt, 0, span, 2, 0.4, 2)
  }
  return { top, main: path(channel), branches }
}

/** The points of a jagged line from a to b: `depth` rounds of splitting, sideways by `roughness` of each segment's length. */
function jag(a: Point, b: Point, depth: number, roughness: number): Point[] {
  let points: Point[] = [a, b]
  for (let round = 0; round < depth; round++) {
    const next: Point[] = [points[0]!]
    for (let i = 1; i < points.length; i++) {
      const [ax, ay] = points[i - 1]!
      const [bx, by] = points[i]!
      const segment = Math.hypot(bx - ax, by - ay)
      const shift = (Math.random() - 0.5) * segment * roughness * 2
      // Sideways: perpendicular to the segment.
      next.push([(ax + bx) / 2 + (-(by - ay) / segment) * shift, (ay + by) / 2 + ((bx - ax) / segment) * shift], points[i]!)
    }
    points = next
  }
  return points
}

const length = (points: Point[]) => points.reduce((sum, point, i) => (i ? sum + Math.hypot(point[0] - points[i - 1]![0], point[1] - points[i - 1]![1]) : 0), 0)

const path = (points: Point[]) => points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
