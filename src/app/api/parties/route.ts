import { NextResponse } from "next/server"
import { errorMessage } from "@/lib/api-error"
import { readAllParties, writeParty } from "@/lib/excel-db"
import { PlateTakenError } from "@/lib/supabase-db"
import { canAccessParty } from "@/lib/guest-session"
import { normalizeThaiMobile } from "@/lib/phone"
import { publicGuests } from "@/lib/public-view"
import type { Party } from "@/lib/types"

/** Scene data for everyone: guests without phone numbers. */
export async function GET() {
  try {
    const parties = await readAllParties()
    return NextResponse.json({ guests: publicGuests(parties) })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: errorMessage(error, "อ่านข้อมูลผู้ลงทะเบียนไม่สำเร็จ") },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Party
    const phone = normalizeThaiMobile(body?.phone ?? "")
    if (!phone || !Array.isArray(body.guests)) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 })
    }
    if (!canAccessParty(request, phone)) {
      return NextResponse.json({ error: "กรุณายืนยันเบอร์มือถืออีกครั้ง" }, { status: 401 })
    }
    const party: Party = {
      ...body,
      phone,
      updatedAt: new Date().toISOString(),
    }
    await writeParty(party)
    return NextResponse.json({ party })
  } catch (error) {
    if (error instanceof PlateTakenError) {
      return NextResponse.json(
        { error: error.message, code: "plate-taken", plate: error.plateNorm, province: error.province },
        { status: 409 }
      )
    }
    console.error(error)
    return NextResponse.json(
      { error: errorMessage(error, "บันทึกผู้ลงทะเบียนไม่สำเร็จ") },
      { status: 500 }
    )
  }
}
