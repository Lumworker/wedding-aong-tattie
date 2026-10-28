import { NextResponse } from "next/server"
import { errorMessage } from "@/lib/api-error"
import { readWishes, updateWish, writeWish } from "@/lib/excel-db"
import { parseWishPayload } from "@/lib/wish"

export async function GET() {
  try {
    const wishes = await readWishes()
    return NextResponse.json({ wishes })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: errorMessage(error, "อ่านความคิดเห็นไม่สำเร็จ") },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = parseWishPayload(body)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }
    await writeWish(parsed.wish)
    return NextResponse.json({ wish: parsed.wish })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: errorMessage(error, "บันทึกความคิดเห็นไม่สำเร็จ") },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = parseWishPayload(body)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }
    await updateWish(parsed.wish)
    return NextResponse.json({ wish: parsed.wish })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: errorMessage(error, "แก้ไขความคิดเห็นไม่สำเร็จ") },
      { status: 500 }
    )
  }
}
