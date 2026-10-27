export type SpriteAtlas = {
  href: string
  cell: number
  cols: number
  rows: number
  count: number
  width: number
  height: number
  /** Source art faces left (−1) or right (1). */
  artFacing: 1 | -1
}

/** Male guest sheet — 6×4 = 24 characters. */
export const MALE_ATLAS: SpriteAtlas = {
  href: "/sprites/guests-male.png?v=5",
  cell: 56,
  cols: 6,
  rows: 4,
  count: 24,
  width: 336,
  height: 224,
  artFacing: 1,
}

/** Female guest sheet — 6×4 = 24 characters. */
export const FEMALE_ATLAS: SpriteAtlas = {
  href: "/sprites/guests-female.png?v=5",
  cell: 56,
  cols: 6,
  rows: 4,
  count: 24,
  width: 336,
  height: 224,
  artFacing: 1,
}

/** Companion cats — 4 variants in a row. */
export const CAT_ATLAS: SpriteAtlas = {
  href: "/sprites/cats.png",
  cell: 40,
  cols: 4,
  rows: 1,
  count: 4,
  width: 160,
  height: 40,
  artFacing: -1,
}
