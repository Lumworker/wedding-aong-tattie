import { mkdir, access } from "node:fs/promises"
import path from "node:path"
import ExcelJS from "exceljs"

const DATA_DIR = path.join(process.cwd(), "data")
const WORKBOOK_PATH = path.join(DATA_DIR, "wedding.xlsx")
const REG = "ผู้ลงทะเบียน"
const WISH = "ความคิดเห็น"

async function main() {
  await mkdir(DATA_DIR, { recursive: true })
  const book = new ExcelJS.Workbook()
  try {
    await access(WORKBOOK_PATH)
    await book.xlsx.readFile(WORKBOOK_PATH)
  } catch {
    /* new book */
  }

  let registrants = book.getWorksheet(REG)
  if (!registrants) registrants = book.addWorksheet(REG)
  registrants.spliceRows(1, registrants.rowCount || 1)
  registrants.addRow(["phone", "guestId", "name", "gender", "ageGroup", "attendance", "side", "isCompanion", "updatedAt"])
  registrants.addRow(["0812345678", "guest-1", "ทดสอบ", "male", "adult", "attending", "groom", "false", new Date().toISOString()])
  registrants.addRow(["0812345678", "guest-2", "ผู้ติดตาม", "other", "adult", "attending", "groom", "true", new Date().toISOString()])

  let wishes = book.getWorksheet(WISH)
  if (!wishes) wishes = book.addWorksheet(WISH)
  wishes.spliceRows(1, wishes.rowCount || 1)
  wishes.addRow(["id", "from", "text", "partyPhone", "createdAt"])
  wishes.addRow(["wish-1", "ทดสอบ", "ยินดีด้วย", "0812345678", new Date().toISOString()])

  await book.xlsx.writeFile(WORKBOOK_PATH)

  const check = new ExcelJS.Workbook()
  await check.xlsx.readFile(WORKBOOK_PATH)
  console.log(
    "sheets",
    check.worksheets.map((sheet) => sheet.name),
    "registrant rows",
    check.getWorksheet(REG).rowCount,
    "wish rows",
    check.getWorksheet(WISH).rowCount
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
