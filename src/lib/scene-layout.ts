import type { Guest } from "@/lib/types"

export const SCENE = {
  width: 640,
  height: 900,
  groom: { x: 278, y: 618 },
  bride: { x: 372, y: 618 },
} as const

const INSIDE_ROUTES: Array<{ x: number[]; y: number[] }> = [
  { x: [250, 390, 430, 220, 250], y: [590, 560, 640, 660, 590] },
  { x: [400, 240, 210, 360, 400], y: [700, 680, 600, 640, 700] },
  { x: [300, 340, 260, 380, 300], y: [740, 640, 700, 620, 740] },
  { x: [200, 320, 420, 250, 200], y: [560, 720, 680, 540, 560] },
  { x: [360, 450, 310, 190, 360], y: [580, 650, 710, 590, 580] },
  { x: [270, 350, 410, 230, 270], y: [760, 580, 630, 700, 760] },
]

const TREE_PEEK_SPOTS = [
  { x: 72, y: 406 },
  { x: 128, y: 356 },
  { x: 48, y: 498 },
  { x: 520, y: 348 },
  { x: 580, y: 398 },
  { x: 598, y: 494 },
  { x: 200, y: 332 },
  { x: 440, y: 324 },
  { x: 36, y: 778 },
  { x: 604, y: 774 },
]

export type PlacedGuest = {
  guest: Guest
  x: number | number[]
  y: number | number[]
  scale: number
  duration: number
  delay: number
  mood: "walk" | "cheer" | "peek"
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function shiftRoute(route: { x: number[]; y: number[] }, slot: number) {
  const dx = (slot % 2 === 0 ? 1 : -1) * (slot + 1) * 12
  const dy = ((slot % 3) - 1) * 10
  return {
    x: route.x.map((value) => clamp(value + dx, 170, 470)),
    y: route.y.map((value) => clamp(value + dy, 540, 760)),
  }
}

export function placeGuests(guests: Guest[], phone: string | null): PlacedGuest[] {
  const rank = (guest: Guest) => (guest.partyPhone === phone ? 0 : 1)
  const attending = guests
    .filter((guest) => guest.attendance === "attending")
    .sort((a, b) => rank(a) - rank(b) || a.id.localeCompare(b.id))
  const absent = guests
    .filter((guest) => guest.attendance === "not_attending")
    .sort((a, b) => rank(a) - rank(b) || a.id.localeCompare(b.id))

  const inside = attending.map((guest, index) => {
    const route = INSIDE_ROUTES[index % INSIDE_ROUTES.length]
    const slot = Math.floor(index / INSIDE_ROUTES.length)
    const shifted = slot === 0 ? route : shiftRoute(route, slot)
    const child = guest.ageGroup === "child"
    return {
      guest,
      x: shifted.x,
      y: shifted.y,
      scale: child ? 0.76 : 0.98,
      duration: 14 + (index % 5) * 2.4,
      delay: index * 0.28,
      mood: "walk" as const,
    }
  })

  const outside = absent.map((guest, index) => {
    const spot = TREE_PEEK_SPOTS[index % TREE_PEEK_SPOTS.length]
    const slot = Math.floor(index / TREE_PEEK_SPOTS.length)
    const x = spot.x + (slot % 2 === 0 ? slot * 10 : -slot * 10)
    const y = spot.y - slot * 6
    const child = guest.ageGroup === "child"
    return {
      guest,
      x,
      y: [y, y - 5, y],
      scale: child ? 0.82 : 1,
      duration: 2.4 + (index % 4) * 0.4,
      delay: index * 0.17,
      mood: "peek" as const,
    }
  })

  return [...inside, ...outside]
}

export function footY(placed: PlacedGuest): number {
  if (placed.mood === "peek") return Array.isArray(placed.y) ? Math.max(...placed.y) + 40 : placed.y + 40
  return Array.isArray(placed.y) ? Math.max(...placed.y) : placed.y
}
