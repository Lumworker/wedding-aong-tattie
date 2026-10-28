import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { errorMessage } from "@/lib/api-error"
import { readAllParties } from "@/lib/excel-db"
import { HOST_COOKIE, hostCookieMatches, hostSecret } from "@/lib/host-auth"
import { partiesToCsv } from "@/lib/rsvp-summary"

export async function GET() {
  if (!hostSecret()) {
    return NextResponse.json({ error: "ยังไม่ได้ตั้ง HOST_DASHBOARD_SECRET" }, { status: 503 })
  }
  const jar = await cookies()
  if (!hostCookieMatches(jar.get(HOST_COOKIE)?.value)) {
    return NextResponse.json({ error: "ยังไม่ได้เข้าสู่ระบบ" }, { status: 401 })
  }
  try {
    const csv = partiesToCsv(await readAllParties())
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="rsvp-aong-tattie.csv"',
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: errorMessage(error, "ส่งออกไม่สำเร็จ") }, { status: 500 })
  }
}
