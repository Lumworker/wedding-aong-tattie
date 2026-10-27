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

/** Nine pew rows, six cats per side — 108 sitters before anyone stands in the narthex. */
export const PEW = {
  rows: 9,
  startY: 530,
  rowGap: 28,
  leftX: 96,
  rightX: 368,
  width: 176,
  seatsPerSide: 6,
  seatGap: 24,
  leftSeat0: 110,
  rightSeat0: 412,
} as const

const AISLE_LANES = [
  { y: 560, x0: 268, x1: 372 },
  { y: 620, x0: 250, x1: 390 },
  { y: 690, x0: 240, x1: 400 },
]

function buildPewSeats() {
  const seats: { x: number; y: number; facing: 1 | -1 }[] = []
  for (let row = 0; row < PEW.rows; row++) {
    const y = PEW.startY + 8 + row * PEW.rowGap
    for (let i = 0; i < PEW.seatsPerSide; i++) {
      seats.push({ x: PEW.leftSeat0 + i * PEW.seatGap, y, facing: 1 })
    }
    for (let i = 0; i < PEW.seatsPerSide; i++) {
      seats.push({ x: PEW.rightSeat0 + i * PEW.seatGap, y, facing: -1 })
    }
  }
  return seats
}

const PEW_SEATS = buildPewSeats()

const STANDING_SPOTS = [
  { x: 118, y: 792, facing: 1 as const },
  { x: 150, y: 796, facing: 1 as const },
  { x: 182, y: 792, facing: 1 as const },
  { x: 214, y: 798, facing: 1 as const },
  { x: 246, y: 794, facing: 1 as const },
  { x: 394, y: 794, facing: -1 as const },
  { x: 426, y: 798, facing: -1 as const },
  { x: 458, y: 792, facing: -1 as const },
  { x: 490, y: 796, facing: -1 as const },
  { x: 522, y: 792, facing: -1 as const },
]

function buildOutsideSpots() {
  const spots: { x: number; y: number; facing: 1 | -1 }[] = []
  for (let col = 0; col < 8; col++) {
    spots.push({ x: 48 + col * 22, y: 848, facing: 1 })
    spots.push({ x: 48 + col * 22, y: 876, facing: 1 })
    spots.push({ x: 430 + col * 22, y: 848, facing: -1 })
    spots.push({ x: 430 + col * 22, y: 876, facing: -1 })
  }
  return spots
}

const OUTSIDE_SPOTS = buildOutsideSpots()

export const SCENE_CAPACITY = {
  pews: PEW_SEATS.length,
  standing: STANDING_SPOTS.length,
  outside: OUTSIDE_SPOTS.length,
  walkers: AISLE_LANES.length,
  attending: PEW_SEATS.length + STANDING_SPOTS.length + AISLE_LANES.length,
} as const

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

  const walkerCount = Math.min(AISLE_LANES.length, attending.length)
  const walkers = attending.slice(0, walkerCount).map((guest, index) => {
    const lane = AISLE_LANES[index % AISLE_LANES.length]
    const child = guest.ageGroup === "child"
    return {
      guest,
      path: patrol(lane, index),
      speed: 38 + (index % 3) * 6,
      scale: child ? 0.62 : 0.74,
      delay: index * 0.7,
      mood: "walk" as const,
      facing: 1 as const,
    }
  })

  const rest = attending.slice(walkerCount)
  const sitters = rest.slice(0, PEW_SEATS.length).map((guest, index) => {
    const seat = PEW_SEATS[index]
    const child = guest.ageGroup === "child"
    return {
      guest,
      path: [{ x: seat.x, y: seat.y, wait: 8 }],
      speed: 20,
      scale: child ? 0.58 : 0.68,
      delay: 0,
      mood: "sit" as const,
      facing: seat.facing,
    }
  })

  const standing = rest.slice(PEW_SEATS.length).map((guest, index) => {
    const spot = STANDING_SPOTS[index % STANDING_SPOTS.length]
    const wrap = Math.floor(index / STANDING_SPOTS.length)
    const child = guest.ageGroup === "child"
    return {
      guest,
      path: [{ x: spot.x + (wrap % 2 === 0 ? 4 : -4), y: spot.y + wrap * 6, wait: 8 }],
      speed: 20,
      scale: child ? 0.58 : 0.7,
      delay: 0,
      mood: "cheer" as const,
      facing: spot.facing,
    }
  })

  const outside = absent.map((guest, index) => {
    const spot = OUTSIDE_SPOTS[index % OUTSIDE_SPOTS.length]
    const wrap = Math.floor(index / OUTSIDE_SPOTS.length)
    const child = guest.ageGroup === "child"
    return {
      guest,
      path: [{ x: spot.x + wrap * 6, y: spot.y, wait: 8 }],
      speed: 20,
      scale: child ? 0.56 : 0.68,
      delay: 0,
      mood: "cheer" as const,
      facing: spot.facing,
    }
  })

  return [...walkers, ...sitters, ...standing, ...outside]
}

export function footY(placed: PlacedGuest): number {
  return Math.max(...placed.path.map((stop) => stop.y))
}
