import { NextResponse } from "next/server"
import { readWishes, updateWish, writeWish } from "@/lib/excel-db"
import type { Wish } from "@/lib/types"

export async function GET() {
  try {
    const wishes = await readWishes()
    return NextResponse.json({ wishes })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "อ่านความคิดเห็นไม่สำเร็จ" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Wish
    if (!body?.id || !body.text || !body.from || !body.partyPhone) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 })
    }
    const wish: Wish = {
      id: body.id,
      text: body.text,
      from: body.from,
      partyPhone: body.partyPhone,
      createdAt: body.createdAt || new Date().toISOString(),
    }
    await writeWish(wish)
    return NextResponse.json({ wish })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "บันทึกความคิดเห็นไม่สำเร็จ" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as Wish
    if (!body?.id || !body.text || !body.from || !body.partyPhone) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 })
    }
    await updateWish(body)
    return NextResponse.json({ wish: body })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "แก้ไขความคิดเห็นไม่สำเร็จ" }, { status: 500 })
  }
}
