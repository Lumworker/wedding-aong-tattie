/**
 * Couple sprite strips. Idle portraits are square. Wave and jump sheets share a
 * 264px-tall row; jump cells are wider in time (6 frames) with an 8px gutter.
 *
 * Jump sheet 1576×264 = 6×256 cells + 5×8 gutters, no outer pad.
 * Frame order: stand, crouch, mid-rise, peak, mid-descend, soft land.
 *
 * Holds are uneven on purpose. Anticipation (crouch) and the landing sit
 * longer than the airborne frames, and the peak keeps one extra beat.
 * Wave frames alternate a lower hand and a raised hand; the raise rests
 * longer than the dip so the arm does not tick on a flat clock.
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
  /** Lower, raised, lower, raised. Average 200ms (was a flat 170). */
  frameMs: [190, 250, 150, 210],
  cycles: 2,
  pauseMs: 8400,
  /** Lower hand, held before the idle portrait so the raise does not cut off. */
  settleFrame: 0,
  settleMs: 230,
} as const

export const COUPLE_JUMP = {
  groom: "/sprites/groom-jump.png?v=4",
  bride: "/sprites/bride-jump.png?v=7",
  frames: 6,
  frameW: 256,
  frameH: 264,
  gutter: 8,
  width: 1576,
  height: 264,
  /** Stand, crouch, mid-rise, peak, mid-descend, land. Average ~157ms (was 120). */
  frameMs: [140, 220, 90, 150, 100, 240],
  /**
   * Whole-body hop in sheet pixels, positive up. Crouch dips; the apex is
   * frame 3; land returns to the stand line. Framer Motion eases between these.
   * Welcome sprite 148 maps frame 3 to translateY(-20.8px), 62% of the old -33.5px,
   * so the feet stay nearer the ground shadow. Land stays on the stand line.
   */
  arc: [0, -3, 20, 36, 15, 0],
  /**
   * Opaque foot line above the cell bottom. Both strips are bottom-aligned
   * on every frame, so the line is flat and `arc` alone lifts the body.
   * Groom shoes sit 6px up (figure about 250 tall). Bride hem stays 12px up.
   */
  foot: {
    groom: [6, 6, 6, 6, 6, 6],
    bride: [12, 12, 12, 12, 12, 12],
  },
} as const

const JUMP_EASE = {
  stand: [0.22, 1, 0.36, 1],
  crouch: [0.45, 0.05, 0.55, 1],
  rise: [0.16, 0.84, 0.3, 1],
  peak: [0.12, 0.9, 0.28, 1],
  descend: [0.55, 0.05, 0.9, 0.45],
  land: [0.16, 1, 0.3, 1],
} as const

export function coupleJumpEase(frame: number) {
  switch (frame) {
    case 1:
      return JUMP_EASE.crouch
    case 2:
      return JUMP_EASE.rise
    case 3:
      return JUMP_EASE.peak
    case 4:
      return JUMP_EASE.descend
    case 5:
      return JUMP_EASE.land
    default:
      return JUMP_EASE.stand
  }
}

/** Scene-space translateY (positive down) so both sprites share `arc`. */
export function coupleJumpOffset(role: "groom" | "bride", frame: number, size: number) {
  const foot = COUPLE_JUMP.foot[role]
  const artLift = foot[frame] - foot[0]
  const scale = size / COUPLE_JUMP.frameW
  return (artLift - COUPLE_JUMP.arc[frame]) * scale
}

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
