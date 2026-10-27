import { google, type sheets_v4 } from "googleapis"
import {
  REGISTRANT_HEADERS,
  SHEET_NAMES,
  WISH_HEADERS,
  docFromMatrices,
  partyMatrix,
  wishMatrix,
} from "@/lib/sheet-schema"
import { emptyDoc, type WeddingDoc } from "@/lib/wedding-doc"

const DEFAULT_SPREADSHEET_ID = "1EUooI-1h01gSsCjjBObjIIgMHcwLbzlt2yM4y97aC2c"

type ServiceAccount = {
  client_email: string
  private_key: string
}

function spreadsheetId() {
  return process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim() || DEFAULT_SPREADSHEET_ID
}

function readCredentials(): ServiceAccount | null {
  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim()
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson) as { client_email?: string; private_key?: string }
      if (parsed.client_email && parsed.private_key) {
        return {
          client_email: parsed.client_email,
          private_key: parsed.private_key.replace(/\\n/g, "\n"),
        }
      }
    } catch {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON ไม่ใช่ JSON ที่ถูกต้อง")
    }
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim()
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n")
  if (email && key) return { client_email: email, private_key: key }
  return null
}

export function isSheetsStorageEnabled() {
  return Boolean(readCredentials())
}

async function sheetsClient(): Promise<sheets_v4.Sheets> {
  const credentials = readCredentials()
  if (!credentials) {
    throw new Error("ยังไม่ได้ตั้งค่า Google service account (GOOGLE_SERVICE_ACCOUNT_*)")
  }
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  })
  return google.sheets({ version: "v4", auth })
}

function asMatrix(values: unknown[][] | null | undefined): string[][] {
  if (!values?.length) return []
  return values.map((row) => row.map((cell) => String(cell ?? "")))
}

async function ensureTabs(sheets: sheets_v4.Sheets, id: string) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: id })
  const existing = new Set(
    (meta.data.sheets ?? [])
      .map((sheet) => sheet.properties?.title)
      .filter((title): title is string => Boolean(title))
  )

  const requests: sheets_v4.Schema$Request[] = []
  if (!existing.has(SHEET_NAMES.registrants)) {
    requests.push({ addSheet: { properties: { title: SHEET_NAMES.registrants } } })
  }
  if (!existing.has(SHEET_NAMES.wishes)) {
    requests.push({ addSheet: { properties: { title: SHEET_NAMES.wishes } } })
  }
  if (requests.length) {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId: id, requestBody: { requests } })
  }
}

export async function loadSheetsDoc(): Promise<WeddingDoc> {
  const sheets = await sheetsClient()
  const id = spreadsheetId()
  await ensureTabs(sheets, id)

  const result = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: id,
    ranges: [`'${SHEET_NAMES.registrants}'!A:I`, `'${SHEET_NAMES.wishes}'!A:E`],
  })

  const registrants = asMatrix(result.data.valueRanges?.[0]?.values)
  const wishes = asMatrix(result.data.valueRanges?.[1]?.values)
  if (!registrants.length && !wishes.length) return emptyDoc()
  return docFromMatrices(
    registrants.length ? registrants : [[...REGISTRANT_HEADERS]],
    wishes.length ? wishes : [[...WISH_HEADERS]]
  )
}

export async function saveSheetsDoc(doc: WeddingDoc): Promise<void> {
  const sheets = await sheetsClient()
  const id = spreadsheetId()
  await ensureTabs(sheets, id)

  const registrantRange = `'${SHEET_NAMES.registrants}'!A:I`
  const wishRange = `'${SHEET_NAMES.wishes}'!A:E`

  await sheets.spreadsheets.values.batchClear({
    spreadsheetId: id,
    requestBody: { ranges: [registrantRange, wishRange] },
  })

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: id,
    requestBody: {
      valueInputOption: "RAW",
      data: [
        { range: `'${SHEET_NAMES.registrants}'!A1`, values: partyMatrix(doc.parties) },
        { range: `'${SHEET_NAMES.wishes}'!A1`, values: wishMatrix(doc.wishes) },
      ],
    },
  })
}
