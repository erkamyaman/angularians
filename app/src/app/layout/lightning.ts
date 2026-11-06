/** A point on the page, in CSS pixels. */
export type Point = [number, number]

/** One strike: where it lands, and its paths (the main channel, then the branches and any second bolt). */
export interface Strike {
  id: number
  x: number
  y: number
  main: string
  branches: string[]
}

/**
 * A storm from the sky down to (x, y), for a page `width` × `height`: a jagged main channel (midpoint displacement, each
 * split pushed sideways a bit less than the last), long branches forking downward across the page, some forking again,
 * and sometimes a second, fainter bolt elsewhere.
 */
export function lightning(x: number, y: number, width: number, height: number): Pick<Strike, 'main' | 'branches'> {
  const channel = jag([x + (Math.random() - 0.5) * width * 0.3, -20], [x, y], 7, 0.22)
  const branches: string[] = []
  const fork = (points: Point[], branchCount: number, reach: number, forkAgain: boolean) => {
    for (let i = 0; i < branchCount; i++) {
      const from = points[Math.floor(points.length * (0.1 + Math.random() * 0.6))]!
      const side = Math.random() < 0.5 ? -1 : 1
      const angle = (25 + Math.random() * 40) * (Math.PI / 180) * side
      const length = Math.max(80, (height - from[1]) * reach * (0.5 + Math.random() * 0.5))
      const to: Point = [from[0] + Math.sin(angle) * length, from[1] + Math.cos(angle) * length]
      const branch = jag(from, to, 6, 0.28)
      branches.push(path(branch))
      if (forkAgain && Math.random() < 0.6) fork(branch, 1 + Math.floor(Math.random() * 2), reach * 0.45, false)
    }
  }
  fork(channel, 4 + Math.floor(Math.random() * 4), 0.75, true)
  if (Math.random() < 0.5) {
    const secondBolt = jag([width * (Math.random() < 0.5 ? 0.1 : 0.85), -20], [width * (0.05 + Math.random() * 0.9), height * (0.3 + Math.random() * 0.3)], 6, 0.25)
    branches.push(path(secondBolt))
    fork(secondBolt, 2, 0.4, false)
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
