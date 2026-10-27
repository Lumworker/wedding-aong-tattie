import type { Guest } from "@/lib/types"

export type Look = {
  skin: string
  hair: string
  outfit: string
  outfitDark: string
  accent: string
  shoe: string
}

const SKINS = ["#F6D3BD", "#F0C4A4", "#E0AA84", "#C6865A", "#8D5524"]
const HAIRS = ["#231C19", "#3B2A22", "#5A3A2A", "#1A1A1A", "#6A4328"]

const BY_GENDER = {
  female: [
    { outfit: "#E7C4C8", outfitDark: "#C48990", accent: "#F7F1EA" },
    { outfit: "#F0D5C8", outfitDark: "#C99B8A", accent: "#FFFCF8" },
    { outfit: "#D7E3D6", outfitDark: "#8FA08A", accent: "#F7F1EA" },
    { outfit: "#E6D3C4", outfitDark: "#C4A48A", accent: "#FFFCF8" },
  ],
  male: [
    { outfit: "#3E4654", outfitDark: "#2A303A", accent: "#F3E6D8" },
    { outfit: "#3F5344", outfitDark: "#2C3B30", accent: "#E7C4C4" },
    { outfit: "#5C4638", outfitDark: "#3E2E24", accent: "#F3E6D8" },
    { outfit: "#4A5568", outfitDark: "#2E3644", accent: "#E7C4C4" },
  ],
  other: [
    { outfit: "#CDB8A4", outfitDark: "#8FA08A", accent: "#F6E7C8" },
    { outfit: "#8FA08A", outfitDark: "#5E7260", accent: "#F7F1EA" },
    { outfit: "#D4C4A8", outfitDark: "#A08B6E", accent: "#E7C4C4" },
  ],
} as const

function hash(id: string): number {
  let h = 2166136261
  for (const char of id) {
    h ^= char.codePointAt(0) ?? 0
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function lookForGuest(guest: Guest): Look {
  const n = hash(guest.id)
  const clothes = BY_GENDER[guest.gender]
  const outfit = clothes[n % clothes.length]
  return {
    skin: SKINS[n % SKINS.length],
    hair: HAIRS[(n >>> 4) % HAIRS.length],
    outfit: outfit.outfit,
    outfitDark: outfit.outfitDark,
    accent: outfit.accent,
    shoe: "#3A2C28",
  }
}

export const GROOM_LOOK: Look = {
  skin: "#F0C4A4",
  hair: "#241C18",
  outfit: "#2C3338",
  outfitDark: "#1C2126",
  accent: "#E7B4B8",
  shoe: "#1A1614",
}

export const BRIDE_LOOK: Look = {
  skin: "#F6D3BD",
  hair: "#3B2A22",
  outfit: "#FFFCF8",
  outfitDark: "#F3E4E2",
  accent: "#E7B4B8",
  shoe: "#F7F1EA",
}
