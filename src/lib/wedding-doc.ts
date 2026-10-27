import type { Party, Wish } from "@/lib/types"

/** Shared in-memory document for parties + wishes (Excel local / Google Sheets prod). */
export type WeddingDoc = {
  parties: Party[]
  wishes: Wish[]
}

export function emptyDoc(): WeddingDoc {
  return { parties: [], wishes: [] }
}

export function upsertParty(doc: WeddingDoc, party: Party): WeddingDoc {
  return {
    ...doc,
    parties: [...doc.parties.filter((item) => item.phone !== party.phone), party],
  }
}

export function removeParty(doc: WeddingDoc, phone: string): WeddingDoc {
  return {
    parties: doc.parties.filter((item) => item.phone !== phone),
    wishes: doc.wishes.filter((wish) => wish.partyPhone !== phone),
  }
}

export function mergeParties(doc: WeddingDoc, parties: Party[]): WeddingDoc {
  const byPhone = new Map(doc.parties.map((item) => [item.phone, item]))
  for (const party of parties) byPhone.set(party.phone, party)
  return { ...doc, parties: [...byPhone.values()] }
}

export function setWishes(doc: WeddingDoc, wishes: Wish[]): WeddingDoc {
  return { ...doc, wishes: wishes.slice(-200) }
}

export function appendWish(doc: WeddingDoc, wish: Wish): WeddingDoc {
  return { ...doc, wishes: [...doc.wishes, wish].slice(-200) }
}

export function replaceWish(doc: WeddingDoc, wish: Wish): WeddingDoc {
  return {
    ...doc,
    wishes: doc.wishes.map((item) => (item.id === wish.id ? wish : item)),
  }
}
