import { NextResponse } from "next/server"
import { errorMessage } from "@/lib/api-error"
import { readWishOwner, readWishes, updateWish, writeWish } from "@/lib/excel-db"
import { isHost, sessionPhone } from "@/lib/guest-session"
import { publicWishes } from "@/lib/public-view"
import { parseWishPayload } from "@/lib/wish"

export async function GET() {
  try {
    const wishes = await readWishes()
    return NextResponse.json({ wishes: publicWishes(wishes) })
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
    const phone = sessionPhone(request)
    if (!phone) return NextResponse.json({ error: "กรุณายืนยันเบอร์มือถืออีกครั้ง" }, { status: 401 })
    const body = await request.json().catch(() => null)
    const parsed = parseWishPayload(body)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }
    // The author is always the signed-in party, whatever the body says.
    const wish = { ...parsed.wish, partyPhone: phone, createdAt: new Date().toISOString() }
    await writeWish(wish)
    return NextResponse.json({ wish: publicWishes([wish])[0] })
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
    const owner = await readWishOwner(parsed.wish.id)
    if (!owner) return NextResponse.json({ error: "ไม่พบคำอวยพรที่จะแก้ไข" }, { status: 404 })
    if (sessionPhone(request) !== owner && !isHost(request)) {
      return NextResponse.json({ error: "แก้ได้เฉพาะคำอวยพรของคุณ" }, { status: 403 })
    }
    const wish = { ...parsed.wish, partyPhone: owner }
    await updateWish(wish)
    return NextResponse.json({ wish: publicWishes([wish])[0] })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: errorMessage(error, "แก้ไขความคิดเห็นไม่สำเร็จ") },
      { status: 500 }
    )
  }
}
