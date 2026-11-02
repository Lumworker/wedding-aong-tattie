import { createHmac, timingSafeEqual } from "node:crypto"
import type { NextResponse } from "next/server"
import { HOST_COOKIE, hostCookieMatches } from "@/lib/host-auth"
import { normalizeThaiMobile } from "@/lib/phone"

/**
 * Server-only guest session.
 *
 * The cookie holds `<phone>.<hmac>` so the server can trust which party a request
 * belongs to. The browser never sees other guests' phone numbers: public lists
 * carry an opaque party key instead (see `partyKey`).
 */
export const GUEST_COOKIE = "guest_session"
const MAX_AGE = 60 * 60 * 24 * 180

function secret() {
  const value = process.env.GUEST_SESSION_SECRET?.trim() || process.env.SUPABASE_SECRET_KEY?.trim()
  if (!value) throw new Error("ยังไม่ได้ตั้ง GUEST_SESSION_SECRET หรือ SUPABASE_SECRET_KEY บนเซิร์ฟเวอร์")
  return value
}

function mac(purpose: string, phone: string) {
  return createHmac("sha256", secret()).update(`${purpose}:${phone}`).digest("hex")
}

function same(left: string, right: string) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** Stable, non-reversible id for a party, safe to send to every browser. */
export function partyKey(phone: string) {
  return `p_${mac("party-key", phone).slice(0, 16)}`
}

/** Opaque guest id for public lists — imported rows use ids like `guest-<phone>`. */
export function publicGuestId(id: string) {
  return `g_${mac("guest-id", id).slice(0, 16)}`
}

function readCookie(request: Request, name: string) {
  const header = request.headers.get("cookie") ?? ""
  for (const part of header.split(";")) {
    const index = part.indexOf("=")
    if (index < 0) continue
    if (part.slice(0, index).trim() === name) return decodeURIComponent(part.slice(index + 1).trim())
  }
  return undefined
}

/** The verified phone for this request, or null. */
export function sessionPhone(request: Request): string | null {
  const raw = readCookie(request, GUEST_COOKIE)
  if (!raw) return null
  const [phone, signature] = raw.split(".")
  if (!phone || !signature || !normalizeThaiMobile(phone)) return null
  return same(signature, mac("session", phone)) ? phone : null
}

export function isHost(request: Request) {
  return hostCookieMatches(readCookie(request, HOST_COOKIE))
}

/** True when the request may read or change this phone's party. */
export function canAccessParty(request: Request, phone: string) {
  return sessionPhone(request) === phone || isHost(request)
}

export function setSession(response: NextResponse, phone: string) {
  response.cookies.set(GUEST_COOKIE, `${phone}.${mac("session", phone)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  })
}

export function clearSession(response: NextResponse) {
  response.cookies.set(GUEST_COOKIE, "", { path: "/", maxAge: 0 })
}

/** Loose name match: trims, folds spaces and case. */
export function namesMatch(input: string, saved: string) {
  const fold = (value: string) => value.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase()
  return fold(input) !== "" && fold(input) === fold(saved)
}

const WINDOW_MS = 15 * 60 * 1000
const MAX_TRIES = 5
const tries = new Map<string, { count: number; first: number }>()

/** Best-effort per-instance limit on name guesses for one phone. */
export function nameAttemptsLeft(phone: string) {
  const entry = tries.get(phone)
  if (!entry || Date.now() - entry.first > WINDOW_MS) return MAX_TRIES
  return Math.max(0, MAX_TRIES - entry.count)
}

export function recordNameMiss(phone: string) {
  const entry = tries.get(phone)
  if (!entry || Date.now() - entry.first > WINDOW_MS) {
    tries.set(phone, { count: 1, first: Date.now() })
    return
  }
  entry.count += 1
}

export function clearNameMisses(phone: string) {
  tries.delete(phone)
}
