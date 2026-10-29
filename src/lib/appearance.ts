import { FEMALE_ATLAS, FOLLOWER_ATLAS, MALE_ATLAS, type SpriteAtlas } from "@/lib/guest-atlas"
import type { Guest } from "@/lib/types"

export type GuestSprite = {
  atlas: SpriteAtlas
  index: number
  col: number
  row: number
}

function hash(id: string) {
  let h = 2166136261
  for (const char of id) {
    h ^= char.codePointAt(0) ?? 0
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function pickAtlas(guest: Guest): SpriteAtlas {
  if (guest.isCompanion) return FOLLOWER_ATLAS
  if (guest.gender === "female") return FEMALE_ATLAS
  if (guest.gender === "male") return MALE_ATLAS
  return hash(guest.id) & 1 ? FEMALE_ATLAS : MALE_ATLAS
}

export function spriteForGuest(guest: Guest): GuestSprite {
  const atlas = pickAtlas(guest)
  const index = hash(guest.id) % atlas.count
  return {
    atlas,
    index,
    col: index % atlas.cols,
    row: Math.floor(index / atlas.cols),
  }
}
