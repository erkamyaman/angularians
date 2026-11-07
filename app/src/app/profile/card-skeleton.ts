/** A box of the 1200 × 630 card, in percent of it: the skeleton is measured on the card (`server/card/card.ts`). */
const box = (x: number, y: number, width: number, height: number, round = false) => ({ left: x / 12, top: y / 6.3, width: width / 12, height: height / 6.3, round })
const TILES = [[508, 56], [834, 56], [508, 276], [834, 276]] as const
export const TILE_BOXES = TILES.map(([x, y]) => box(x, y, 302, 196))
/** The first load, before there is a card to show: changing the period keeps the card and dims it instead. */
export const SKELETON_BOXES = [
  box(64, 56, 124, 124, true),
  box(64, 196, 270, 46),
  box(64, 258, 180, 76),
  box(64, 348, 200, 34),
  box(64, 520, 320, 66),
  box(884, 520, 252, 66),
  ...TILES.flatMap(([x, y]) => [box(x + 26, y + 26, 40, 40, true), box(x + 26, y + 78, 150, 52), box(x + 26, y + 138, 150, 28)]),
]
