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
  href: "/sprites/guests-male.png?v=8",
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
  href: "/sprites/guests-female.png?v=8",
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

/**
 * Companion people — 8 front-facing variants.
 * `pixel` 1.7 is about 60% of a guest (frame 40 × pixel 2).
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
