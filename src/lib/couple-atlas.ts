/**
 * Couple sprite strips. Idle portraits are square. Wave and jump sheets share a
 * 264px-tall row; jump cells are wider in time (6 frames) with an 8px gutter.
 *
 * Jump sheet 1576×264 = 6×256 cells + 5×8 gutters, no outer pad.
 * Frame order: stand, crouch, rise, peak, descend, land.
 */

export const COUPLE_IDLE = {
  groom: "/sprites/groom.png?v=6",
  bride: "/sprites/bride.png?v=6",
  frame: 256,
} as const

export const COUPLE_WAVE = {
  groom: "/sprites/groom-wave.png?v=3",
  bride: "/sprites/bride-wave.png?v=3",
  frames: 4,
  frame: 256,
  gutter: 4,
  width: 1044,
  height: 264,
  frameMs: 170,
  cycles: 2,
  pauseMs: 8400,
} as const

export const COUPLE_JUMP = {
  groom: "/sprites/groom-jump.png?v=2",
  bride: "/sprites/bride-jump.png?v=2",
  frames: 6,
  frameW: 256,
  frameH: 264,
  gutter: 8,
  width: 1576,
  height: 264,
  frameMs: 120,
} as const

/**
 * Head-and-shoulders peeks for the registration cards.
 * Hands sit at the bottom of each file; the card edge belongs under the collar.
 */
export const COUPLE_PEEK = {
  groom: "/sprites/groom-peek.png?v=1",
  bride: "/sprites/bride-peek.png?v=1",
} as const

export function coupleJumpOrigin(index: number) {
  return index * (COUPLE_JUMP.frameW + COUPLE_JUMP.gutter)
}

export function coupleWaveOrigin(index: number) {
  return COUPLE_WAVE.gutter + index * (COUPLE_WAVE.frame + COUPLE_WAVE.gutter)
}
