/** Guest records are the unit a future API can store and return. */

export type Gender = "male" | "female" | "other"

export type AgeGroup = "adult" | "child"

export type Attendance = "attending" | "not_attending"

export type Guest = {
  id: string
  name: string
  gender: Gender
  ageGroup: AgeGroup
  attendance: Attendance
  /**
   * Phone number of the party that registered this guest.
   * Seeded demo guests use the sentinel `seed`.
   */
  partyPhone: string
}

export type Party = {
  phone: string
  guests: Guest[]
  updatedAt: string
}
