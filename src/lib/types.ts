export type Gender = "male" | "female" | "other"
export type AgeGroup = "adult" | "child"
export type Attendance = "attending" | "not_attending"

export type Guest = {
  id: string
  name: string
  gender: Gender
  ageGroup: AgeGroup
  attendance: Attendance
  partyPhone: string
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
