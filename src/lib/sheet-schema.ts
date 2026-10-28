import { PARTY_MAX } from "@/lib/event"
import type { Attendance, FamilySide, Gender, Guest, Party, Wish } from "@/lib/types"
import type { WeddingDoc } from "@/lib/wedding-doc"

export const SHEET_NAMES = {
  registrants: "ผู้ลงทะเบียน",
  wishes: "ความคิดเห็น",
} as const

/** One row per phone. Legacy sheets used guestId / ageGroup / isCompanion and are still readable. */
export const REGISTRANT_HEADERS = [
  "phone",
  "name",
  "side",
  "gender",
  "attendance",
  "companionStatus",
  "companionCount",
  "updatedAt",
] as const

export const SIDE_GROOM = "อ๋อง"
export const SIDE_BRIDE = "แทต"
export const WITH_COMPANIONS = "มีผู้ติดตาม"
export const WITHOUT_COMPANIONS = "ไม่มีผู้ติดตาม"

/** Clear through column I so a rewrite drops the old guestId sheet. */
export const REGISTRANT_CLEAR_RANGE = "A:I"

export const WISH_HEADERS = ["id", "from", "text", "partyPhone", "createdAt"] as const

function asGender(value: string): Gender {
  return value === "female" || value === "male" || value === "other" ? value : "other"
}

function asAttendance(value: string): Attendance {
  return value === "attending" ? "attending" : "unsure"
}

export function sideToSheet(side: FamilySide | undefined): string {
  if (side === "groom") return SIDE_GROOM
  if (side === "bride") return SIDE_BRIDE
  return ""
}

export function sideFromSheet(value: string | undefined): FamilySide | undefined {
  const text = value?.trim() ?? ""
  if (text === SIDE_GROOM || text === "groom" || text === "ฝั่งเจ้าบ่าว") return "groom"
  if (text === SIDE_BRIDE || text === "แทตตี้" || text === "bride" || text === "ฝั่งเจ้าสาว") return "bride"
  return undefined
}

function isLegacyRow(row: Record<string, string>) {
  return row.guestId !== undefined || row.isCompanion !== undefined || row.ageGroup !== undefined
}

function companionCountFrom(row: Record<string, string>) {
  const parsed = Number.parseInt(row.companionCount ?? "", 10)
  if (Number.isFinite(parsed) && parsed >= 0) return parsed
  if (row.companionStatus === WITH_COMPANIONS) return 1
  return 0
}

function buildParty(input: {
  phone: string
  name: string
  gender: Gender
  attendance: Attendance
  side: FamilySide | undefined
  companionCount: number
  updatedAt: string
}): Party {
  const count = Math.min(PARTY_MAX - 1, Math.max(0, input.companionCount))
  const main: Guest = {
    id: `guest-${input.phone}`,
    name: input.name || "แขก",
    gender: input.gender,
    ageGroup: "adult",
    attendance: input.attendance,
    side: input.side,
    partyPhone: input.phone,
  }
  const companions: Guest[] = Array.from({ length: count }, (_, index) => ({
    id: `companion-${input.phone}-${index + 1}`,
    name: count === 1 ? "ผู้ติดตาม" : `ผู้ติดตาม ${index + 1}`,
    gender: "other",
    ageGroup: "adult",
    attendance: input.attendance,
    side: input.side,
    partyPhone: input.phone,
    isCompanion: true,
  }))
  return {
    phone: input.phone,
    updatedAt: input.updatedAt,
    guests: [main, ...companions],
  }
}

function partyFromLegacy(phone: string, rows: Record<string, string>[]): Party {
  const companions = rows.filter((row) => row.isCompanion === "true" || row.isCompanion === "1")
  const mains = rows.filter((row) => row.isCompanion !== "true" && row.isCompanion !== "1")
  const main = mains.at(-1) ?? rows[0]
  const updatedAt = rows.map((row) => row.updatedAt).filter(Boolean).sort().at(-1) || new Date(0).toISOString()
  return buildParty({
    phone,
    name: main?.name || "แขก",
    gender: asGender(main?.gender ?? ""),
    attendance: asAttendance(main?.attendance ?? ""),
    side: sideFromSheet(main?.side),
    companionCount: companions.length,
    updatedAt,
  })
}

function partyFromModern(phone: string, row: Record<string, string>): Party {
  return buildParty({
    phone,
    name: row.name || "แขก",
    gender: asGender(row.gender),
    attendance: asAttendance(row.attendance),
    side: sideFromSheet(row.side),
    companionCount: companionCountFrom(row),
    updatedAt: row.updatedAt || new Date(0).toISOString(),
  })
}

/** Collapse every row for a phone into one party. A later save rewrites that phone as a single row. */
export function partiesFromRowRecords(rows: Record<string, string>[]): Party[] {
  const legacy = new Map<string, Record<string, string>[]>()
  const modern = new Map<string, Party>()

  for (const row of rows) {
    const phone = row.phone?.trim()
    if (!phone || phone === "phone" || row.name === "name") continue
    if (isLegacyRow(row)) {
      const group = legacy.get(phone) ?? []
      group.push(row)
      legacy.set(phone, group)
      continue
    }
    const party = partyFromModern(phone, row)
    const previous = modern.get(phone)
    if (!previous || party.updatedAt >= previous.updatedAt) modern.set(phone, party)
  }

  const byPhone = new Map<string, Party>()
  for (const [phone, group] of legacy) byPhone.set(phone, partyFromLegacy(phone, group))
  for (const [phone, party] of modern) {
    const previous = byPhone.get(phone)
    if (!previous || party.updatedAt >= previous.updatedAt) byPhone.set(phone, party)
  }
  return [...byPhone.values()]
}

export function partyToSheetRow(party: Party): string[] {
  const main = party.guests.find((guest) => !guest.isCompanion) ?? party.guests[0]
  const count = party.guests.filter((guest) => guest.isCompanion).length
  return [
    party.phone,
    main?.name ?? "",
    sideToSheet(main?.side),
    main?.gender ?? "",
    main?.attendance ?? "",
    count > 0 ? WITH_COMPANIONS : WITHOUT_COMPANIONS,
    String(count),
    party.updatedAt,
  ]
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
  return [[...REGISTRANT_HEADERS], ...parties.map((party) => partyToSheetRow(party))]
}

export function wishMatrix(wishes: Wish[]): string[][] {
  return [
    [...WISH_HEADERS],
    ...wishes.map((item) => [item.id, item.from, item.text, item.partyPhone, item.createdAt]),
  ]
}

const KNOWN_HEADERS = new Set<string>([
  ...REGISTRANT_HEADERS,
  ...WISH_HEADERS,
  "guestId",
  "ageGroup",
  "isCompanion",
])

export function recordsFromMatrix(matrix: string[][], headers: readonly string[]): Record<string, string>[] {
  if (!matrix.length) return []
  const first = matrix[0].map((cell) => cell.trim())
  const headerLike = first.some((cell) => KNOWN_HEADERS.has(cell))
  const start = headerLike ? 1 : 0
  const keys = headerLike ? first : [...headers]
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
