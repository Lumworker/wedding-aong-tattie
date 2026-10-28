import type { Wish } from "@/lib/types"

/** Hard cap for a blessing. Counted in Unicode code points so Thai marks count once each. */
export const WISH_TEXT_MAX = 200

const WISH_FROM_MAX = 80

export function wishGlyphCount(value: string) {
  return Array.from(value).length
}

export function clipWishText(value: string, max = WISH_TEXT_MAX) {
  const glyphs = Array.from(value)
  if (glyphs.length <= max) return value
  return glyphs.slice(0, max).join("")
}

export function parseWishPayload(
  input: unknown
): { ok: true; wish: Wish } | { ok: false; error: string } {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "ข้อมูลไม่ครบ" }
  }

  const body = input as Partial<Record<keyof Wish, unknown>>
  const id = typeof body.id === "string" ? body.id.trim() : ""
  const text = typeof body.text === "string" ? body.text.trim() : ""
  const from = typeof body.from === "string" ? body.from.trim() : ""
  const partyPhone = typeof body.partyPhone === "string" ? body.partyPhone.trim() : ""
  const createdAt =
    typeof body.createdAt === "string" && body.createdAt.trim()
      ? body.createdAt
      : new Date().toISOString()

  if (!id || !text || !from || !partyPhone) {
    return { ok: false, error: "ข้อมูลไม่ครบ" }
  }
  if (wishGlyphCount(text) > WISH_TEXT_MAX) {
    return { ok: false, error: "ข้อความอวยพรยาวเกิน 200 ตัวอักษร" }
  }
  if (wishGlyphCount(from) > WISH_FROM_MAX) {
    return { ok: false, error: "ชื่อยาวเกินไป" }
  }

  return { ok: true, wish: { id, text, from, partyPhone, createdAt } }
}
