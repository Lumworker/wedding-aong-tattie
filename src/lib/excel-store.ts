import { access, mkdir } from "node:fs/promises"
import path from "node:path"
import ExcelJS from "exceljs"
import {
  REGISTRANT_HEADERS,
  SHEET_NAMES,
  WISH_HEADERS,
  partiesFromRowRecords,
  partyMatrix,
  wishesFromRowRecords,
  wishMatrix,
} from "@/lib/sheet-schema"
import type { Wish } from "@/lib/types"
import { emptyDoc, type WeddingDoc } from "@/lib/wedding-doc"

const DATA_DIR = path.join(process.cwd(), "data")
const WORKBOOK_PATH = path.join(DATA_DIR, "wedding.xlsx")

export const SHEETS = SHEET_NAMES

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

function wishRows(wishes: Wish[]) {
  return wishMatrix(wishes).slice(1)
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
    parties: partiesFromRowRecords(sheetRows(registrants)),
    wishes: wishesFromRowRecords(sheetRows(wishes)),
  }
}

export async function saveExcelDoc(doc: WeddingDoc): Promise<void> {
  assertLocalWorkbook()
  await ensureWorkbook()
  const book = new ExcelJS.Workbook()
  book.creator = "wedding-aong-tattie"
  const registrants = partyMatrix(doc.parties)
  rewriteSheet(book, SHEETS.registrants, registrants[0] ?? REGISTRANT_HEADERS, registrants.slice(1))
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
