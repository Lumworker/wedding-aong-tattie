import { isThaiMobile } from "@/lib/phone"
import type { Party, Wish } from "@/lib/types"

export type WeddingRepository = {
  readSessionPhone(): string | null
  writeSessionPhone(phone: string): void
  clearSessionPhone(): void
  readParty(phone: string): Promise<Party | null>
  writeParty(party: Party): Promise<void>
  deleteParty(phone: string): Promise<void>
  readAllParties(): Promise<Party[]>
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

/** Session stays in the browser; parties + wishes live in Excel via API. */
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
    async readAllParties() {
      const data = await api<{ parties: Party[] }>("/api/parties")
      return data.parties ?? []
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
