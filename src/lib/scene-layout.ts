import type { Guest } from "@/lib/types"
import type { Stop } from "@/lib/walk"

export const SCENE = {
  width: 640,
  height: 900,
  groom: { x: 268, y: 534 },
  bride: { x: 374, y: 534 },
} as const

const AISLE_LANES = [
  { y: 576, x0: 238, x1: 402 },
  { y: 590, x0: 226, x1: 414 },
  { y: 604, x0: 232, x1: 408 },
  { y: 616, x0: 244, x1: 396 },
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
  path: Stop[]
  speed: number
  scale: number
  delay: number
  mood: "walk" | "cheer"
}

function patrol(lane: (typeof AISLE_LANES)[number], slot: number, phase: number): Stop[] {
  const inset = (slot % 3) * 10
  const left = lane.x0 + inset
  const right = lane.x1 - inset
  const mid = Math.round((left + right) / 2 + ((phase % 2) * 2 - 1) * 18)
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
      path: patrol(lane, slot, index),
      speed: 36 + (index % 4) * 7,
      scale: child ? 0.78 : 1,
      delay: index * 0.55,
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
      path: [{ x, y, wait: 8 }],
      speed: 20,
      scale: (child ? 0.78 : 1) * near,
      delay: index * 0.17,
      mood: "cheer" as const,
    }
  })

  return [...inside, ...outside]
}

export function footY(placed: PlacedGuest): number {
  return Math.max(...placed.path.map((stop) => stop.y))
}
