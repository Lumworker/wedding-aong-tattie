import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { HOST_COOKIE, hostSecret, hostToken, secretsMatch } from "@/lib/host-auth"

export async function POST(request: Request) {
  if (!hostSecret()) {
    return NextResponse.json({ error: "ยังไม่ได้ตั้ง HOST_DASHBOARD_SECRET" }, { status: 503 })
  }
  const body = (await request.json().catch(() => null)) as { secret?: string } | null
  if (!body?.secret || !secretsMatch(body.secret)) {
    return NextResponse.json({ error: "รหัสไม่ถูกต้อง" }, { status: 401 })
  }
  const jar = await cookies()
  jar.set(HOST_COOKIE, hostToken(hostSecret()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  })
  return NextResponse.json({ ok: true })
}
