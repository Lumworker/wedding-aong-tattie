import { NextResponse } from "next/server"
import { errorMessage } from "@/lib/api-error"
import { deleteParty, readParty } from "@/lib/excel-db"
import { canAccessParty } from "@/lib/guest-session"
import { normalizeThaiMobile } from "@/lib/phone"

type Context = { params: Promise<{ phone: string }> }

async function target(request: Request, context: Context) {
  const { phone } = await context.params
  const normalized = normalizeThaiMobile(decodeURIComponent(phone))
  if (!normalized || !canAccessParty(request, normalized)) return null
  return normalized
}

export async function GET(request: Request, context: Context) {
  try {
    const phone = await target(request, context)
    if (!phone) return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 401 })
    const party = await readParty(phone)
    if (!party) return NextResponse.json({ party: null }, { status: 404 })
    return NextResponse.json({ party })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: errorMessage(error, "อ่านข้อมูลไม่สำเร็จ") }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const phone = await target(request, context)
    if (!phone) return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 401 })
    await deleteParty(phone)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: errorMessage(error, "ลบการลงทะเบียนไม่สำเร็จ") },
      { status: 500 }
    )
  }
}
