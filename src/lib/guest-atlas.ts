export type SpriteAtlas = {
  href: string
  frameW: number
  frameH: number
  /** Walk frames packed left to right inside each character slot. */
  frames: number
  cols: number
  rows: number
  count: number
  width: number
  height: number
  /** SVG units per frame pixel. Guest cells are scaled to GUEST_DRAW_HEIGHT. */
  pixel: number
  /** Source art faces left (−1) or right (1). */
  artFacing: 1 | -1
}

/**
 * Drawn guest height in scene units. Followers (`frameH` 26 × pixel 1.7 ≈ 44)
 * stay about 60% of this, under the couple.
 */
const GUEST_DRAW_HEIGHT = 80

/**
 * Venue guests — one 2×6 sheet, one pose per cell.
 * Indices 0–5 are the top row (male). Indices 6–11 are the bottom row (female).
 * Art faces slightly right. Built by scripts/build-guests.py.
 */
export const GUEST_ATLAS: SpriteAtlas = {
  href: "/sprites/guests.png?v=9",
  frameW: 177,
  frameH: 309,
  frames: 1,
  cols: 6,
  rows: 2,
  count: 12,
  width: 1062,
  height: 618,
  pixel: GUEST_DRAW_HEIGHT / 309,
  artFacing: 1,
}

/**
 * Companion people — 8 front-facing variants.
 * `pixel` 1.7 is about 60% of a guest (guest cells draw at 80 scene units).
 * artFacing 1: the sheet faces the camera, so scene facing is not pre-mirrored.
 */
export const FOLLOWER_ATLAS: SpriteAtlas = {
  href: "/sprites/followers.png?v=1",
  frameW: 17,
  frameH: 26,
  frames: 1,
  cols: 8,
  rows: 1,
  count: 8,
  width: 136,
  height: 26,
  pixel: 1.7,
  artFacing: 1,
}
