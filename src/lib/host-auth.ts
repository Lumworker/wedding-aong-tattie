import { createHmac, timingSafeEqual } from "node:crypto"

export const HOST_COOKIE = "host_dashboard"

export function hostSecret() {
  return process.env.HOST_DASHBOARD_SECRET?.trim() ?? ""
}

export function hostToken(secret: string) {
  return createHmac("sha256", secret).update("wedding-aong-tattie-host").digest("hex")
}

function same(left: string, right: string) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function secretsMatch(input: string) {
  const secret = hostSecret()
  if (!secret || !input) return false
  return same(input, secret)
}

export function hostCookieMatches(value: string | undefined) {
  const secret = hostSecret()
  if (!secret || !value) return false
  return same(value, hostToken(secret))
}
