import type { Guest } from "@/lib/types"

const HUES = [8, 22, 36, 52, 68, 88, 112, 138, 158, 178, 198, 218, 242, 268, 292, 318, 338, 14]

export type GuestSprite = {
  type: number
  row: number
  hue: number
  saturate: number
  brightness: number
}

function hash(id: string) {
  let h = 2166136261
  for (const char of id) {
    h ^= char.codePointAt(0) ?? 0
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function spriteForGuest(guest: Guest): GuestSprite {
  const n = hash(guest.id)
  const rowBias = guest.gender === "female" ? 0 : guest.gender === "male" ? 12 : 6
  return {
    type: n % 9,
    row: (rowBias + ((n >>> 3) % 24)) % 36,
    hue: HUES[n % HUES.length],
    saturate: 1.4 + ((n >>> 7) % 6) * 0.16,
    brightness: 0.86 + ((n >>> 11) % 6) * 0.06,
  }
}
