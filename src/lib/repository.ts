import type { Party, Wish } from "@/lib/types"

/**
 * Persistence boundary. The UI talks to `guestStore`, which calls this.
 * Replace `createLocalWeddingRepository` with an HTTP implementation
 * that keeps the same methods when a backend exists.
 */
export interface WeddingRepository {
  readSessionPhone(): string | null
  writeSessionPhone(phone: string): void
  clearSessionPhone(): void
  readParty(phone: string): Party | null
  writeParty(party: Party): void
  readAllParties(): Party[]
  readWishes(): Wish[]
  writeWish(wish: Wish): void
}

const SESSION_KEY = "webding-web:session"
const PARTY_PREFIX = "webding-web:party:"
const WISH_KEY = "webding-web:wishes"
const COOKIE = "webding_phone"
const WISH_MAX = 80

const memory = new Map<string, string>()

function readRaw(key: string): string | null {
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
    // Private mode or a full quota: keep the in-memory copy for this visit.
  }
}

function removeRaw(key: string) {
  memory.delete(key)
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Ignore storage failures; the memory map is already cleared.
  }
}

function storageKeys(): string[] {
  const keys = new Set(memory.keys())
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i)
      if (key) keys.add(key)
    }
  } catch {
    // localStorage unavailable
  }
  return [...keys]
}

function readCookiePhone(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/(?:^|; )webding_phone=([^;]*)/)
  if (!match) return null
  const value = decodeURIComponent(match[1])
  return /^0[689]\d{8}$/.test(value) ? value : null
}

function writeCookiePhone(phone: string) {
  if (typeof document === "undefined") return
  document.cookie = `${COOKIE}=${encodeURIComponent(phone)}; Path=/; Max-Age=31536000; SameSite=Lax`
}

function clearCookiePhone() {
  if (typeof document === "undefined") return
  document.cookie = `${COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
}

function parseWishes(raw: string | null): Wish[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as Wish[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (wish) =>
        wish &&
        typeof wish.id === "string" &&
        typeof wish.text === "string" &&
        typeof wish.from === "string" &&
        typeof wish.partyPhone === "string"
    )
  } catch {
    return []
  }
}

function parseParty(raw: string | null): Party | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Party
    if (!parsed || typeof parsed.phone !== "string" || !Array.isArray(parsed.guests)) return null
    return parsed
  } catch {
    return null
  }
}

export function createLocalWeddingRepository(): WeddingRepository {
  return {
    readSessionPhone() {
      const stored = readRaw(SESSION_KEY)
      if (stored && /^0[689]\d{8}$/.test(stored)) return stored
      return readCookiePhone()
    },
    writeSessionPhone(phone) {
      writeRaw(SESSION_KEY, phone)
      writeCookiePhone(phone)
    },
    clearSessionPhone() {
      removeRaw(SESSION_KEY)
      clearCookiePhone()
    },
    readParty(phone) {
      return parseParty(readRaw(`${PARTY_PREFIX}${phone}`))
    },
    writeParty(party) {
      writeRaw(`${PARTY_PREFIX}${party.phone}`, JSON.stringify(party))
    },
    readAllParties() {
      const parties: Party[] = []
      for (const key of storageKeys()) {
        if (!key.startsWith(PARTY_PREFIX)) continue
        const party = parseParty(readRaw(key))
        if (party) parties.push(party)
      }
      return parties
    },
    readWishes() {
      return parseWishes(readRaw(WISH_KEY)).slice(-WISH_MAX)
    },
    writeWish(wish) {
      const next = [...parseWishes(readRaw(WISH_KEY)), wish].slice(-WISH_MAX)
      writeRaw(WISH_KEY, JSON.stringify(next))
    },
  }
}
