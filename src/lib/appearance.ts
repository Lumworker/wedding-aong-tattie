import { FOLLOWER_ATLAS, GUEST_ATLAS, type SpriteAtlas } from "@/lib/guest-atlas"
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

/** Males are guests.png indices 0–5. Females are 6–11. */
function guestIndex(guest: Guest) {
  const pick = hash(guest.id)
  if (guest.gender === "female") return GUEST_ATLAS.cols + (pick % GUEST_ATLAS.cols)
  if (guest.gender === "male") return pick % GUEST_ATLAS.cols
  return pick % GUEST_ATLAS.count
}

function spriteIndex(guest: Guest, atlas: SpriteAtlas) {
  if (guest.isCompanion) return hash(guest.id) % atlas.count
  return guestIndex(guest)
}

export function spriteForGuest(guest: Guest): GuestSprite {
  const atlas = guest.isCompanion ? FOLLOWER_ATLAS : GUEST_ATLAS
  const index = spriteIndex(guest, atlas)
  return {
    atlas,
    index,
    col: index % atlas.cols,
    row: Math.floor(index / atlas.cols),
  }
}
