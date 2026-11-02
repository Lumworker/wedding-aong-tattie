import { isThaiMobile } from "@/lib/phone"
import type { Guest, Party, Wish } from "@/lib/types"

/** A server-verified session. `selfKey` is how this party appears in public lists. */
export type Session = { phone: string; selfKey: string; party: Party | null }

export type SessionStatus = "new" | "verified" | "need-name" | "wrong-name" | "locked"

export type WeddingRepository = {
  /** Last phone typed on this device — only used to prefill the phone field. */
  readSessionPhone(): string | null
  writeSessionPhone(phone: string): void
  clearSessionPhone(): void
  readSession(): Promise<Session | null>
  startSession(phone: string, name?: string): Promise<{ status: SessionStatus; session: Session | null }>
  endSession(): Promise<void>
  readParty(phone: string): Promise<Party | null>
  writeParty(party: Party): Promise<void>
  deleteParty(phone: string): Promise<void>
  readAllGuests(): Promise<Guest[]>
  readWishes(): Promise<Wish[]>
  writeWish(wish: Wish): Promise<void>
  updateWish(wish: Wish): Promise<void>
}

const SESSION_KEY = "webding-web:session"
const COOKIE = "webding_phone"
const memory = new Map<string, string>()

function readRaw(key: string) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return memory.get(key) ?? null
  }
}

function writeRaw(key: string, value: string) {
  memory.set(key, value)
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* keep memory */
  }
}

function removeRaw(key: string) {
  memory.delete(key)
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

function cookiePhone() {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/(?:^|; )webding_phone=([^;]*)/)
  const value = match ? decodeURIComponent(match[1]) : ""
  return isThaiMobile(value) ? value : null
}

function setCookie(phone: string | null) {
  if (typeof document === "undefined") return
  document.cookie = phone
    ? `${COOKIE}=${encodeURIComponent(phone)}; Path=/; Max-Age=31536000; SameSite=Lax`
    : `${COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(payload?.error || `API ${response.status}`)
  }
  return response.json() as Promise<T>
}

/** Session stays in the browser. Parties and wishes go through the API, which stores them in Supabase. */
export function createExcelWeddingRepository(): WeddingRepository {
  return {
    readSessionPhone() {
      const stored = readRaw(SESSION_KEY)
      return stored && isThaiMobile(stored) ? stored : cookiePhone()
    },
    writeSessionPhone(phone) {
      writeRaw(SESSION_KEY, phone)
      setCookie(phone)
    },
    clearSessionPhone() {
      removeRaw(SESSION_KEY)
      setCookie(null)
    },
    async readSession() {
      const data = await api<{ session: Session | null }>("/api/session")
      return data.session
    },
    async startSession(phone, name) {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, name }),
      })
      const payload = (await response.json().catch(() => null)) as
        | { status?: SessionStatus; session?: Session | null; error?: string }
        | null
      if (!payload?.status) throw new Error(payload?.error || `API ${response.status}`)
      return { status: payload.status, session: payload.session ?? null }
    },
    async endSession() {
      await api("/api/session", { method: "DELETE" })
    },
    async readParty(phone) {
      try {
        const data = await api<{ party: Party }>(`/api/parties/${encodeURIComponent(phone)}`)
        return data.party
      } catch {
        return null
      }
    },
    async writeParty(party) {
      await api("/api/parties", { method: "POST", body: JSON.stringify(party) })
    },
    async deleteParty(phone) {
      await api(`/api/parties/${encodeURIComponent(phone)}`, { method: "DELETE" })
    },
    async readAllGuests() {
      const data = await api<{ guests: Guest[] }>("/api/parties")
      return data.guests ?? []
    },
    async readWishes() {
      const data = await api<{ wishes: Wish[] }>("/api/wishes")
      return data.wishes ?? []
    },
    async writeWish(wish) {
      await api("/api/wishes", { method: "POST", body: JSON.stringify(wish) })
    },
    async updateWish(wish) {
      await api("/api/wishes", { method: "PATCH", body: JSON.stringify(wish) })
    },
  }
}
