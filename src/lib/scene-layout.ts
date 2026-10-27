import type { Guest } from "@/lib/types"
import type { Stop } from "@/lib/walk"

export const SCENE = {
  width: 640,
  height: 900,
  groom: { x: 268, y: 458 },
  bride: { x: 372, y: 458 },
} as const

/** Raised sanctuary. Guests stay on the nave floor below this line. */
export const PLATFORM = {
  y: 458,
  edge: 512,
  left: 168,
  right: 472,
} as const

const AISLE_LANES = [
  { y: 548, x0: 118, x1: 522 },
  { y: 582, x0: 108, x1: 532 },
  { y: 616, x0: 102, x1: 538 },
  { y: 650, x0: 108, x1: 532 },
  { y: 684, x0: 118, x1: 522 },
  { y: 718, x0: 132, x1: 508 },
]

const OUTSIDE_SPOTS = [
  { x: 86, y: 848 },
  { x: 148, y: 862 },
  { x: 554, y: 848 },
  { x: 492, y: 862 },
]

export type PlacedGuest = {
  guest: Guest
  path: Stop[]
  speed: number
  scale: number
  delay: number
  mood: "walk" | "cheer"
}

function patrol(lane: (typeof AISLE_LANES)[number], slot: number, phase: number): Stop[] {
  const inset = (slot % 3) * 14
  const left = lane.x0 + inset
  const right = lane.x1 - inset
  const mid = Math.round((left + right) / 2 + ((phase % 2) * 2 - 1) * 22)
  if (phase % 2 === 0) {
    return [
      { x: left, y: lane.y, wait: 0.35 },
      { x: mid, y: lane.y, wait: 0.55 },
      { x: right, y: lane.y, wait: 0.8 },
      { x: mid, y: lane.y, wait: 0.4 },
    ]
  }
  return [
    { x: right, y: lane.y, wait: 0.3 },
    { x: left, y: lane.y, wait: 0.9 },
    { x: mid, y: lane.y, wait: 0.45 },
  ]
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
    const lane = AISLE_LANES[index % AISLE_LANES.length]
    const slot = Math.floor(index / AISLE_LANES.length)
    const child = guest.ageGroup === "child"
    return {
      guest,
      path: patrol(lane, slot, index).map((stop) => ({ ...stop, y: Math.max(stop.y, PLATFORM.edge + 16) })),
      speed: 40 + (index % 4) * 8,
      scale: child ? 0.72 : 0.88,
      delay: index * 0.55,
      mood: "walk" as const,
    }
  })

  const outside = absent.map((guest, index) => {
    const spot = OUTSIDE_SPOTS[index % OUTSIDE_SPOTS.length]
    const slot = Math.floor(index / OUTSIDE_SPOTS.length)
    const x = spot.x + (slot % 2 === 0 ? slot * 10 : -slot * 10)
    const y = spot.y
    const child = guest.ageGroup === "child"
    return {
      guest,
      path: [{ x, y, wait: 8 }],
      speed: 20,
      scale: child ? 0.68 : 0.82,
      delay: index * 0.17,
      mood: "cheer" as const,
    }
  })

  return [...inside, ...outside]
}

export function footY(placed: PlacedGuest): number {
  return Math.max(...placed.path.map((stop) => stop.y))
}
