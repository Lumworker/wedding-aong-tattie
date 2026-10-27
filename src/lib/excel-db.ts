import { loadExcelDoc, saveExcelDoc, SHEETS, workbookPath } from "@/lib/excel-store"
import { isSheetsStorageEnabled, loadSheetsDoc, saveSheetsDoc } from "@/lib/google-sheets-store"
import type { Party, Wish } from "@/lib/types"
import {
  appendWish,
  mergeParties,
  removeParty,
  replaceWish,
  setWishes,
  upsertParty,
  type WeddingDoc,
} from "@/lib/wedding-doc"

export { SHEETS, workbookPath }

let queue: Promise<unknown> = Promise.resolve()

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn)
  queue = run.then(
    () => undefined,
    () => undefined
  )
  return run
}

async function loadDoc(): Promise<WeddingDoc> {
  if (isSheetsStorageEnabled()) return loadSheetsDoc()
  return loadExcelDoc()
}

async function saveDoc(doc: WeddingDoc): Promise<void> {
  if (isSheetsStorageEnabled()) {
    await saveSheetsDoc(doc)
    return
  }
  await saveExcelDoc(doc)
}

async function updateDoc(mutator: (doc: WeddingDoc) => WeddingDoc): Promise<WeddingDoc> {
  return withLock(async () => {
    const next = mutator(await loadDoc())
    await saveDoc(next)
    return next
  })
}

export async function readAllParties(): Promise<Party[]> {
  return withLock(async () => (await loadDoc()).parties)
}

export async function readParty(phone: string): Promise<Party | null> {
  const parties = await readAllParties()
  return parties.find((party) => party.phone === phone) ?? null
}

export async function writeParty(party: Party): Promise<void> {
  await updateDoc((doc) => upsertParty(doc, party))
}

export async function deleteParty(phone: string): Promise<void> {
  await updateDoc((doc) => removeParty(doc, phone))
}

/** Merge many parties in one write — used by mock seeding. */
export async function upsertParties(parties: Party[]): Promise<void> {
  await updateDoc((doc) => mergeParties(doc, parties))
}

export async function replaceWishes(wishes: Wish[]): Promise<void> {
  await updateDoc((doc) => setWishes(doc, wishes))
}

export async function readWishes(): Promise<Wish[]> {
  return withLock(async () => (await loadDoc()).wishes)
}

export async function writeWish(wish: Wish): Promise<void> {
  await updateDoc((doc) => appendWish(doc, wish))
}

export async function updateWish(wish: Wish): Promise<void> {
  await updateDoc((doc) => replaceWish(doc, wish))
}
