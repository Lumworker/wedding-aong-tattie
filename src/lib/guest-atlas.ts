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
  /** SVG units per frame pixel. 2 keeps guest pixels chunky beside the couple. */
  pixel: number
  /** Source art faces left (−1) or right (1). */
  artFacing: 1 | -1
}

/** Male guests — 6×4 characters, 2 frames each, from Pixel People. */
export const MALE_ATLAS: SpriteAtlas = {
  href: "/sprites/guests-male.png?v=6",
  frameW: 23,
  frameH: 40,
  frames: 2,
  cols: 6,
  rows: 4,
  count: 24,
  width: 276,
  height: 160,
  pixel: 2,
  artFacing: 1,
}

/** Female guests — same cell size as the male sheet. */
export const FEMALE_ATLAS: SpriteAtlas = {
  href: "/sprites/guests-female.png?v=6",
  frameW: 23,
  frameH: 40,
  frames: 2,
  cols: 6,
  rows: 4,
  count: 24,
  width: 276,
  height: 160,
  pixel: 2,
  artFacing: 1,
}

/** Companion cats — 4 variants in a row. */
export const CAT_ATLAS: SpriteAtlas = {
  href: "/sprites/cats.png",
  frameW: 40,
  frameH: 40,
  frames: 1,
  cols: 4,
  rows: 1,
  count: 4,
  width: 160,
  height: 40,
  pixel: 0.5,
  artFacing: -1,
}
