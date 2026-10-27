import { NextResponse } from "next/server"
import { errorMessage } from "@/lib/api-error"
import { replaceWishes, upsertParties } from "@/lib/excel-db"
import { buildMockParties, buildMockWishes } from "@/lib/mock-guests"

/** Seed ~50 mock guests (+ sample wishes) for venue previews. */
export async function POST() {
  try {
    const parties = buildMockParties()
    const wishes = buildMockWishes(parties)
    await upsertParties(parties)
    await replaceWishes(wishes)
    const guests = parties.reduce((sum, party) => sum + party.guests.length, 0)
    return NextResponse.json({
      ok: true,
      parties: parties.length,
      guests,
      wishes: wishes.length,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: errorMessage(error, "สร้างข้อมูล mock ไม่สำเร็จ") },
      { status: 500 }
    )
  }
}
