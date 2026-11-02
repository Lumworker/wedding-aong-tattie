import { NextResponse } from "next/server"
import { errorMessage } from "@/lib/api-error"
import { replaceWishes, upsertParties } from "@/lib/excel-db"
import { isHost } from "@/lib/guest-session"
import { buildMockParties, buildMockWishes } from "@/lib/mock-guests"

/**
 * Seed ~50 mock guests (+ sample wishes) for venue previews.
 * This replaces every wish, so only a signed-in host may run it.
 */
export async function POST(request: Request) {
  if (!isHost(request)) {
    return NextResponse.json({ error: "เฉพาะเจ้าภาพที่ล็อกอิน /host แล้ว" }, { status: 401 })
  }
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
