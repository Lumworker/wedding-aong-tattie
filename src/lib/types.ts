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

export type Party = {
  phone: string
  guests: Guest[]
  updatedAt: string
}

export type Wish = {
  id: string
  text: string
  from: string
  partyPhone: string
  createdAt: string
}
