import type { Guest } from "@/lib/types"

export const SCENE = {
  width: 640,
  height: 900,
  groom: { x: 268, y: 534 },
  bride: { x: 374, y: 534 },
} as const

const INSIDE_ROUTES: Array<{ x: number[]; y: number[] }> = [
  { x: [228, 402, 416, 244, 228], y: [592, 568, 608, 598, 592] },
  { x: [408, 252, 236, 388, 408], y: [606, 578, 562, 594, 606] },
  { x: [322, 334, 286, 360, 322], y: [604, 552, 574, 566, 604] },
  { x: [236, 318, 396, 268, 236], y: [564, 606, 582, 552, 564] },
  { x: [378, 424, 304, 220, 378], y: [572, 608, 590, 560, 572] },
  { x: [268, 362, 404, 248, 268], y: [608, 560, 586, 574, 608] },
]

const OUTSIDE_SPOTS = [
  { x: 92, y: 728 },
  { x: 140, y: 804 },
  { x: 74, y: 868 },
  { x: 548, y: 722 },
  { x: 498, y: 798 },
  { x: 574, y: 862 },
  { x: 198, y: 870 },
  { x: 446, y: 874 },
  { x: 154, y: 758 },
  { x: 488, y: 746 },
]

export type PlacedGuest = {
  guest: Guest
  x: number | number[]
  y: number | number[]
  scale: number
  duration: number
  delay: number
  mood: "walk" | "cheer"
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function shiftRoute(route: { x: number[]; y: number[] }, slot: number) {
  const dx = (slot % 2 === 0 ? 1 : -1) * (slot + 1) * 10
  const dy = ((slot % 3) - 1) * 8
  return {
    x: route.x.map((value) => clamp(value + dx, 214, 428)),
    y: route.y.map((value) => clamp(value + dy, 548, 610)),
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
      duration: 12 + (index % 5) * 2.2,
      delay: index * 0.28,
      mood: "walk" as const,
    }
  })

  const outside = absent.map((guest, index) => {
    const spot = OUTSIDE_SPOTS[index % OUTSIDE_SPOTS.length]
    const slot = Math.floor(index / OUTSIDE_SPOTS.length)
    const x = spot.x + (slot % 2 === 0 ? slot * 12 : -slot * 12)
    const y = spot.y - slot * 8
    const child = guest.ageGroup === "child"
    const near = y > 820 ? 1.05 : 1
    return {
      guest,
      x,
      y: [y, y - 6, y],
      scale: (child ? 0.76 : 0.98) * near,
      duration: 2.15 + (index % 4) * 0.38,
      delay: index * 0.17,
      mood: "cheer" as const,
    }
  })

  return [...inside, ...outside]
}

export function footY(placed: PlacedGuest): number {
  return Array.isArray(placed.y) ? Math.max(...placed.y) : placed.y
}
