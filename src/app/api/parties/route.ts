import { NextResponse } from "next/server"
import { errorMessage } from "@/lib/api-error"
import { readAllParties, writeParty } from "@/lib/excel-db"
import type { Party } from "@/lib/types"

export async function GET() {
  try {
    const parties = await readAllParties()
    return NextResponse.json({ parties })
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
    if (!body?.phone || !Array.isArray(body.guests)) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 })
    }
    const party: Party = {
      phone: body.phone,
      guests: body.guests,
      updatedAt: body.updatedAt || new Date().toISOString(),
    }
    await writeParty(party)
    return NextResponse.json({ party })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: errorMessage(error, "บันทึกผู้ลงทะเบียนไม่สำเร็จ") },
      { status: 500 }
    )
  }
}
