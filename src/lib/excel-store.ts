import { access, mkdir } from "node:fs/promises"
import path from "node:path"
import ExcelJS from "exceljs"
import type { AgeGroup, Attendance, FamilySide, Gender, Guest, Party, Wish } from "@/lib/types"
import { emptyDoc, type WeddingDoc } from "@/lib/wedding-doc"

const DATA_DIR = path.join(process.cwd(), "data")
const WORKBOOK_PATH = path.join(DATA_DIR, "wedding.xlsx")

export const SHEETS = {
  registrants: "ผู้ลงทะเบียน",
  wishes: "ความคิดเห็น",
} as const

const REGISTRANT_HEADERS = [
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

const WISH_HEADERS = ["id", "from", "text", "partyPhone", "createdAt"] as const

function styleHeader(sheet: ExcelJS.Worksheet) {
  const row = sheet.getRow(1)
  row.font = { bold: true }
  row.commit()
}

function assertLocalWorkbook() {
  if (process.env.VERCEL) {
    throw new Error("เซิร์ฟเวอร์นี้ไม่เขียนไฟล์ Excel ใช้ Google Sheets ผ่าน GOOGLE_SERVICE_ACCOUNT_JSON")
  }
}

async function ensureWorkbook() {
  assertLocalWorkbook()
  await mkdir(DATA_DIR, { recursive: true })
  try {
    await access(WORKBOOK_PATH)
  } catch {
    const book = new ExcelJS.Workbook()
    book.creator = "wedding-aong-tattie"
    const registrants = book.addWorksheet(SHEETS.registrants)
    registrants.addRow([...REGISTRANT_HEADERS])
    styleHeader(registrants)
    const wishes = book.addWorksheet(SHEETS.wishes)
    wishes.addRow([...WISH_HEADERS])
    styleHeader(wishes)
    await book.xlsx.writeFile(WORKBOOK_PATH)
  }
}

function cellText(value: ExcelJS.CellValue | undefined) {
  if (value == null) return ""
  if (typeof value === "object" && "text" in value) return String(value.text ?? "")
  if (typeof value === "object" && "result" in value) return String(value.result ?? "")
  return String(value)
}

function sheetRows(sheet: ExcelJS.Worksheet) {
  const rows: Record<string, string>[] = []
  const headerRow = sheet.getRow(1)
  const headers: string[] = []
  headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
    headers[col] = cellText(cell.value).trim()
  })
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return
    const item: Record<string, string> = {}
    let any = false
    headers.forEach((header, col) => {
      if (!header) return
      const text = cellText(row.getCell(col).value).trim()
      item[header] = text
      if (text) any = true
    })
    if (any) rows.push(item)
  })
  return rows
}

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

function partiesFromRows(rows: Record<string, string>[]): Party[] {
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

function wishesFromRows(rows: Record<string, string>[]): Wish[] {
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

function ensureSheet(book: ExcelJS.Workbook, name: string, headers: readonly string[]) {
  let sheet = book.getWorksheet(name)
  if (!sheet) {
    sheet = book.addWorksheet(name)
    sheet.addRow([...headers])
    styleHeader(sheet)
  }
  return sheet
}

function rewriteSheet(
  book: ExcelJS.Workbook,
  name: string,
  headers: readonly string[],
  rows: (string | number | boolean)[][]
) {
  const previous = book.getWorksheet(name)
  if (previous) book.removeWorksheet(previous.id)
  const sheet = book.addWorksheet(name)
  sheet.addRow([...headers])
  styleHeader(sheet)
  for (const row of rows) sheet.addRow(row)
  return sheet
}

function partyRows(parties: Party[]) {
  return parties.flatMap((item) =>
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
  )
}

function wishRows(wishes: Wish[]) {
  return wishes.map((item) => [item.id, item.from, item.text, item.partyPhone, item.createdAt])
}

export function workbookPath() {
  return WORKBOOK_PATH
}

export async function loadExcelDoc(): Promise<WeddingDoc> {
  assertLocalWorkbook()
  await ensureWorkbook()
  const book = new ExcelJS.Workbook()
  await book.xlsx.readFile(WORKBOOK_PATH)
  const registrants = ensureSheet(book, SHEETS.registrants, REGISTRANT_HEADERS)
  const wishes = ensureSheet(book, SHEETS.wishes, WISH_HEADERS)
  return {
    parties: partiesFromRows(sheetRows(registrants)),
    wishes: wishesFromRows(sheetRows(wishes)),
  }
}

export async function saveExcelDoc(doc: WeddingDoc): Promise<void> {
  assertLocalWorkbook()
  await ensureWorkbook()
  const book = new ExcelJS.Workbook()
  book.creator = "wedding-aong-tattie"
  rewriteSheet(book, SHEETS.registrants, REGISTRANT_HEADERS, partyRows(doc.parties))
  rewriteSheet(book, SHEETS.wishes, WISH_HEADERS, wishRows(doc.wishes))
  await book.xlsx.writeFile(WORKBOOK_PATH)
}

export async function ensureExcelDoc(): Promise<WeddingDoc> {
  try {
    return await loadExcelDoc()
  } catch {
    const doc = emptyDoc()
    await saveExcelDoc(doc)
    return doc
  }
}
