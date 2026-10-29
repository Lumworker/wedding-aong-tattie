import { loadExcelDoc } from "../src/lib/excel-store"
import { replaceWishes, upsertParties } from "../src/lib/supabase-db"

const doc = await loadExcelDoc()
await upsertParties(doc.parties)
await replaceWishes(doc.wishes)

const guests = doc.parties.reduce((sum, party) => sum + party.guests.length, 0)
console.log(`imported parties=${doc.parties.length} guests=${guests} wishes=${doc.wishes.length}`)
