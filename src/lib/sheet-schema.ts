import type { AgeGroup, Attendance, FamilySide, Gender, Guest, Party, Wish } from "@/lib/types"
import type { WeddingDoc } from "@/lib/wedding-doc"

export const SHEET_NAMES = {
  registrants: "ผู้ลงทะเบียน",
  wishes: "ความคิดเห็น",
} as const

export const REGISTRANT_HEADERS = [
  "phone",
  "guestId",
  "name",
  "gender",
  "ageGroup",
  "attendance",
  "side",
  "isCompanion",
  "updatedAt",
] as const

export const WISH_HEADERS = ["id", "from", "text", "partyPhone", "createdAt"] as const

function asGender(value: string): Gender {
  return value === "female" || value === "male" || value === "other" ? value : "other"
}

function asAttendance(value: string): Attendance {
  return value === "attending" ? "attending" : "unsure"
}

function asAge(value: string): AgeGroup {
  return value === "child" ? "child" : "adult"
}

function asSide(value: string): FamilySide | undefined {
  return value === "groom" || value === "bride" ? value : undefined
}

export function partiesFromRowRecords(rows: Record<string, string>[]): Party[] {
  const byPhone = new Map<string, Party>()
  for (const row of rows) {
    const phone = row.phone?.trim()
    if (!phone || phone === "phone") continue
    const guest: Guest = {
      id: row.guestId || `guest-${phone}-${byPhone.get(phone)?.guests.length ?? 0}`,
      name: row.name || "ผู้ติดตาม",
      gender: asGender(row.gender),
      ageGroup: asAge(row.ageGroup),
      attendance: asAttendance(row.attendance),
      side: asSide(row.side),
      partyPhone: phone,
      isCompanion: row.isCompanion === "true" || row.isCompanion === "1",
    }
    if (guest.id === "guestId" || guest.name === "name") continue

    const existing = byPhone.get(phone)
    if (existing) {
      const index = existing.guests.findIndex((item) => item.id === guest.id)
      if (index >= 0) existing.guests[index] = guest
      else existing.guests.push(guest)
      if (row.updatedAt && row.updatedAt > existing.updatedAt) existing.updatedAt = row.updatedAt
    } else {
      byPhone.set(phone, {
        phone,
        updatedAt: row.updatedAt || new Date().toISOString(),
        guests: [guest],
      })
    }
  }

  for (const party of byPhone.values()) {
    const mains = party.guests.filter((guest) => !guest.isCompanion)
    const companions = party.guests.filter((guest) => guest.isCompanion)
    if (mains.length > 1) {
      party.guests = [mains[mains.length - 1], ...companions]
    }
  }

  return [...byPhone.values()]
}

export function wishesFromRowRecords(rows: Record<string, string>[]): Wish[] {
  return rows
    .map((row) => ({
      id: row.id,
      from: row.from,
      text: row.text,
      partyPhone: row.partyPhone,
      createdAt: row.createdAt || new Date().toISOString(),
    }))
    .filter((wish) => wish.id && wish.text && wish.from && wish.partyPhone)
}

export function partyMatrix(parties: Party[]): string[][] {
  return [
    [...REGISTRANT_HEADERS],
    ...parties.flatMap((item) =>
      item.guests.map((guest) => [
        item.phone,
        guest.id,
        guest.name,
        guest.gender,
        guest.ageGroup,
        guest.attendance,
        guest.side ?? "",
        guest.isCompanion ? "true" : "false",
        item.updatedAt,
      ])
    ),
  ]
}

export function wishMatrix(wishes: Wish[]): string[][] {
  return [
    [...WISH_HEADERS],
    ...wishes.map((item) => [item.id, item.from, item.text, item.partyPhone, item.createdAt]),
  ]
}

export function recordsFromMatrix(matrix: string[][], headers: readonly string[]): Record<string, string>[] {
  if (!matrix.length) return []
  const first = matrix[0].map((cell) => cell.trim())
  const hasHeader = headers.every((header, index) => first[index] === header)
  const start = hasHeader ? 1 : 0
  const keys = hasHeader ? first : [...headers]
  const rows: Record<string, string>[] = []
  for (let i = start; i < matrix.length; i += 1) {
    const line = matrix[i]
    if (!line?.some((cell) => cell.trim())) continue
    const item: Record<string, string> = {}
    keys.forEach((key, col) => {
      if (!key) return
      item[key] = String(line[col] ?? "").trim()
    })
    rows.push(item)
  }
  return rows
}

export function docFromMatrices(registrants: string[][], wishes: string[][]): WeddingDoc {
  return {
    parties: partiesFromRowRecords(recordsFromMatrix(registrants, REGISTRANT_HEADERS)),
    wishes: wishesFromRowRecords(recordsFromMatrix(wishes, WISH_HEADERS)),
  }
}
