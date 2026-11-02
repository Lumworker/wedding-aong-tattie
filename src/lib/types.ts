export type Gender = "male" | "female" | "other"
export type AgeGroup = "adult" | "child"
export type Attendance = "attending" | "unsure" | "declined"
export type FamilySide = "groom" | "bride"

export type Guest = {
  id: string
  name: string
  gender: Gender
  ageGroup: AgeGroup
  attendance: Attendance
  /** Groom or bride side — optional for older saved parties. */
  side?: FamilySide
  partyPhone: string
  /** Anonymous follower — no personal details collected. */
  isCompanion?: boolean
}

export type TravelMode = "drive" | "taxi" | "transit" | "dropoff" | "unknown"

export type Car = {
  id: string
  /** As typed, e.g. "1กข 1234". */
  plate: string
  province: string
}

export type Travel = {
  mode: TravelMode | null
  /** Only meaningful when mode is "drive". */
  needsParking: boolean | null
  /** One to three cars when parking is needed, else empty. */
  cars: Car[]
}

export type Party = {
  phone: string
  guests: Guest[]
  updatedAt: string
  /** Missing on parties saved before the travel step existed. */
  travel?: Travel
}

export type Wish = {
  id: string
  text: string
  from: string
  partyPhone: string
  createdAt: string
}
