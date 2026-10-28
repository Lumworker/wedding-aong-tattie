import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { HOST_COOKIE, hostCookieMatches, hostSecret } from "@/lib/host-auth"
import { readAllParties } from "@/lib/excel-db"
import { errorMessage } from "@/lib/api-error"
import { summarizeParties } from "@/lib/rsvp-summary"

export async function GET() {
  if (!hostSecret()) {
    return NextResponse.json({ error: "ยังไม่ได้ตั้ง HOST_DASHBOARD_SECRET" }, { status: 503 })
  }
  const jar = await cookies()
  if (!hostCookieMatches(jar.get(HOST_COOKIE)?.value)) {
    return NextResponse.json({ error: "ยังไม่ได้เข้าสู่ระบบ" }, { status: 401 })
  }
  try {
    const parties = await readAllParties()
    return NextResponse.json({ parties, summary: summarizeParties(parties) })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: errorMessage(error, "อ่านรายชื่อไม่สำเร็จ") }, { status: 500 })
  }
}
