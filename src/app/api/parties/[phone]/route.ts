import { NextResponse } from "next/server"
import { errorMessage } from "@/lib/api-error"
import { deleteParty, readParty } from "@/lib/excel-db"

export async function GET(_request: Request, context: { params: Promise<{ phone: string }> }) {
  try {
    const { phone } = await context.params
    const party = await readParty(decodeURIComponent(phone))
    if (!party) return NextResponse.json({ party: null }, { status: 404 })
    return NextResponse.json({ party })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: errorMessage(error, "อ่านข้อมูลไม่สำเร็จ") }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ phone: string }> }) {
  try {
    const { phone } = await context.params
    await deleteParty(decodeURIComponent(phone))
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: errorMessage(error, "ลบการลงทะเบียนไม่สำเร็จ") },
      { status: 500 }
    )
  }
}
