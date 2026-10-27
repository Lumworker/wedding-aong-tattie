import type { Guest } from "@/lib/types"
import type { Stop } from "@/lib/walk"

export const SCENE = {
  width: 640,
  height: 900,
  groom: { x: 268, y: 458 },
  bride: { x: 372, y: 458 },
} as const

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

type Spot = { x: number; y: number; facing: 1 | -1 }

const AISLE = [
  { y: 560, x0: 268, x1: 372 },
  { y: 620, x0: 250, x1: 390 },
  { y: 690, x0: 240, x1: 400 },
]

function pewSeats(): Spot[] {
  const seats: Spot[] = []
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

function outsideSpots(): Spot[] {
  const spots: Spot[] = []
  for (let col = 0; col < 8; col++) {
    spots.push({ x: 48 + col * 22, y: 848, facing: 1 }, { x: 48 + col * 22, y: 876, facing: 1 })
    spots.push({ x: 430 + col * 22, y: 848, facing: -1 }, { x: 430 + col * 22, y: 876, facing: -1 })
  }
  return spots
}

const PEW_SEATS = pewSeats()
const OUTSIDE = outsideSpots()
const STANDING: Spot[] = [
  { x: 118, y: 792, facing: 1 },
  { x: 150, y: 796, facing: 1 },
  { x: 182, y: 792, facing: 1 },
  { x: 214, y: 798, facing: 1 },
  { x: 246, y: 794, facing: 1 },
  { x: 394, y: 794, facing: -1 },
  { x: 426, y: 798, facing: -1 },
  { x: 458, y: 792, facing: -1 },
  { x: 490, y: 796, facing: -1 },
  { x: 522, y: 792, facing: -1 },
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

function scaleOf(guest: Guest, child: number, adult: number) {
  return guest.ageGroup === "child" ? child : adult
}

function still(guest: Guest, spot: Spot, mood: PlacedGuest["mood"], child: number, adult: number): PlacedGuest {
  return {
    guest,
    path: [{ x: spot.x, y: spot.y, wait: 8 }],
    speed: 20,
    scale: scaleOf(guest, child, adult),
    delay: 0,
    mood,
    facing: spot.facing,
  }
}

function wrapSpot(spots: Spot[], index: number, jitter: (wrap: number, spot: Spot) => Spot) {
  const wrap = Math.floor(index / spots.length)
  const spot = spots[index % spots.length]
  return jitter(wrap, spot)
}

export function placeGuests(guests: Guest[], phone: string | null): PlacedGuest[] {
  const rank = (guest: Guest) => (guest.partyPhone === phone ? 0 : 1)
  const byId = (a: Guest, b: Guest) => rank(a) - rank(b) || a.id.localeCompare(b.id)
  const attending = guests.filter((guest) => guest.attendance === "attending").sort(byId)
  const absent = guests.filter((guest) => guest.attendance === "not_attending").sort(byId)

  const walkerCount = Math.min(AISLE.length, attending.length)
  const walkers = attending.slice(0, walkerCount).map((guest, index) => {
    const lane = AISLE[index % AISLE.length]
    const even = index % 2 === 0
    return {
      guest,
      path: even
        ? [
            { x: lane.x0, y: lane.y, wait: 0.8 },
            { x: lane.x1, y: lane.y, wait: 1.1 },
          ]
        : [
            { x: lane.x1, y: lane.y, wait: 0.7 },
            { x: lane.x0, y: lane.y, wait: 1.2 },
          ],
      speed: 38 + (index % 3) * 6,
      scale: scaleOf(guest, 0.62, 0.74),
      delay: index * 0.7,
      mood: "walk" as const,
      facing: 1 as const,
    }
  })

  const rest = attending.slice(walkerCount)
  const sitters = rest.slice(0, PEW_SEATS.length).map((guest, index) => still(guest, PEW_SEATS[index], "sit", 0.58, 0.68))
  const standing = rest.slice(PEW_SEATS.length).map((guest, index) =>
    still(
      guest,
      wrapSpot(STANDING, index, (wrap, spot) => ({
        ...spot,
        x: spot.x + (wrap % 2 === 0 ? 4 : -4),
        y: spot.y + wrap * 6,
      })),
      "cheer",
      0.58,
      0.7
    )
  )
  const outside = absent.map((guest, index) =>
    still(
      guest,
      wrapSpot(OUTSIDE, index, (wrap, spot) => ({ ...spot, x: spot.x + wrap * 6 })),
      "cheer",
      0.56,
      0.68
    )
  )

  return [...walkers, ...sitters, ...standing, ...outside]
}

export function footY(placed: PlacedGuest) {
  return Math.max(...placed.path.map((stop) => stop.y))
}
