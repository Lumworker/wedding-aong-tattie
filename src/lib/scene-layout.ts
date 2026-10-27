import type { Guest } from "@/lib/types"
import type { Stop } from "@/lib/walk"

export const SCENE = {
  width: 640,
  height: 900,
  groom: { x: 268, y: 458 },
  bride: { x: 372, y: 458 },
} as const

export const PLATFORM = {
  y: 458,
  edge: 512,
  left: 168,
  right: 472,
} as const

const AISLE_LANES = [
  { y: 560, x0: 268, x1: 372 },
  { y: 620, x0: 250, x1: 390 },
  { y: 690, x0: 240, x1: 400 },
]

const PEW_SEATS = [
  { x: 140, y: 548, facing: 1 as const },
  { x: 188, y: 548, facing: 1 as const },
  { x: 236, y: 548, facing: 1 as const },
  { x: 404, y: 548, facing: -1 as const },
  { x: 452, y: 548, facing: -1 as const },
  { x: 500, y: 548, facing: -1 as const },
  { x: 140, y: 590, facing: 1 as const },
  { x: 188, y: 590, facing: 1 as const },
  { x: 236, y: 590, facing: 1 as const },
  { x: 404, y: 590, facing: -1 as const },
  { x: 452, y: 590, facing: -1 as const },
  { x: 500, y: 590, facing: -1 as const },
  { x: 140, y: 632, facing: 1 as const },
  { x: 188, y: 632, facing: 1 as const },
  { x: 404, y: 632, facing: -1 as const },
  { x: 452, y: 632, facing: -1 as const },
  { x: 140, y: 674, facing: 1 as const },
  { x: 236, y: 674, facing: 1 as const },
  { x: 404, y: 674, facing: -1 as const },
  { x: 500, y: 674, facing: -1 as const },
  { x: 188, y: 716, facing: 1 as const },
  { x: 452, y: 716, facing: -1 as const },
]

const OUTSIDE_SPOTS = [
  { x: 88, y: 848, facing: 1 as const },
  { x: 150, y: 860, facing: 1 as const },
  { x: 552, y: 848, facing: -1 as const },
  { x: 490, y: 860, facing: -1 as const },
]

export type PlacedGuest = {
  guest: Guest
  path: Stop[]
  speed: number
  scale: number
  delay: number
  mood: "walk" | "cheer" | "sit"
  facing: 1 | -1
}

function patrol(lane: (typeof AISLE_LANES)[number], phase: number): Stop[] {
  const left = lane.x0
  const right = lane.x1
  if (phase % 2 === 0) {
    return [
      { x: left, y: lane.y, wait: 0.8 },
      { x: right, y: lane.y, wait: 1.1 },
    ]
  }
  return [
    { x: right, y: lane.y, wait: 0.7 },
    { x: left, y: lane.y, wait: 1.2 },
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

  const walkerCount = Math.min(3, attending.length)
  const walkers = attending.slice(0, walkerCount).map((guest, index) => {
    const lane = AISLE_LANES[index % AISLE_LANES.length]
    const child = guest.ageGroup === "child"
    return {
      guest,
      path: patrol(lane, index),
      speed: 38 + (index % 3) * 6,
      scale: child ? 0.7 : 0.84,
      delay: index * 0.7,
      mood: "walk" as const,
      facing: 1 as const,
    }
  })

  const sitters = attending.slice(walkerCount).map((guest, index) => {
    const seat = PEW_SEATS[index % PEW_SEATS.length]
    const slot = Math.floor(index / PEW_SEATS.length)
    const child = guest.ageGroup === "child"
    return {
      guest,
      path: [{ x: seat.x + (slot % 2 === 0 ? 6 : -6), y: seat.y, wait: 8 }],
      speed: 20,
      scale: child ? 0.66 : 0.8,
      delay: 0,
      mood: "sit" as const,
      facing: seat.facing,
    }
  })

  const outside = absent.map((guest, index) => {
    const spot = OUTSIDE_SPOTS[index % OUTSIDE_SPOTS.length]
    const slot = Math.floor(index / OUTSIDE_SPOTS.length)
    const child = guest.ageGroup === "child"
    return {
      guest,
      path: [{ x: spot.x + slot * 8, y: spot.y, wait: 8 }],
      speed: 20,
      scale: child ? 0.64 : 0.78,
      delay: index * 0.17,
      mood: "cheer" as const,
      facing: spot.facing,
    }
  })

  return [...walkers, ...sitters, ...outside]
}

export function footY(placed: PlacedGuest): number {
  return Math.max(...placed.path.map((stop) => stop.y))
}
