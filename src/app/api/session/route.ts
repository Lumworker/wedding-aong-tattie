import { NextResponse } from "next/server"
import { errorMessage } from "@/lib/api-error"
import { readParty } from "@/lib/excel-db"
import {
  clearNameMisses,
  clearSession,
  nameAttemptsLeft,
  namesMatch,
  partyKey,
  recordNameMiss,
  sessionPhone,
  setSession,
} from "@/lib/guest-session"
import { normalizeThaiMobile } from "@/lib/phone"

/** Who am I? Returns the verified phone, its party and its public key. */
export async function GET(request: Request) {
  try {
    const phone = sessionPhone(request)
    if (!phone) return NextResponse.json({ session: null })
    const party = await readParty(phone)
    return NextResponse.json({ session: { phone, selfKey: partyKey(phone), party } })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: errorMessage(error, "อ่านข้อมูลไม่สำเร็จ") }, { status: 500 })
  }
}

/**
 * Start a session for a phone.
 * - New phone → session starts right away.
 * - Phone with a saved party → the name it was saved under must match first.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { phone?: string; name?: string } | null
    const phone = normalizeThaiMobile(body?.phone ?? "")
    if (!phone) return NextResponse.json({ error: "เบอร์โทรไม่ถูกต้อง" }, { status: 400 })

    const party = await readParty(phone)
    const main = party?.guests.find((guest) => !guest.isCompanion) ?? party?.guests[0]

    if (party && main) {
      if (nameAttemptsLeft(phone) === 0) {
        return NextResponse.json({ status: "locked" }, { status: 429 })
      }
      const name = body?.name?.trim() ?? ""
      if (!name) return NextResponse.json({ status: "need-name" })
      if (!namesMatch(name, main.name)) {
        recordNameMiss(phone)
        const status = nameAttemptsLeft(phone) === 0 ? "locked" : "wrong-name"
        return NextResponse.json({ status }, { status: status === "locked" ? 429 : 401 })
      }
      clearNameMisses(phone)
    }

    const response = NextResponse.json({
      status: party ? "verified" : "new",
      session: { phone, selfKey: partyKey(phone), party: party ?? null },
    })
    setSession(response, phone)
    return response
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: errorMessage(error, "เปิดข้อมูลไม่สำเร็จ") }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  clearSession(response)
  return response
}
