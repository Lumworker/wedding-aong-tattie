import { isThaiMobile } from "@/lib/phone"
import type { Party, Wish } from "@/lib/types"

export type WeddingRepository = {
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
    /* keep the in-memory copy */
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

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function asParty(value: unknown): Party | null {
  if (!value || typeof value !== "object") return null
  const party = value as Party
  if (typeof party.phone !== "string" || !Array.isArray(party.guests)) return null
  return party
}

function asWishes(value: unknown): Wish[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (wish): wish is Wish =>
      Boolean(wish) &&
      typeof wish.id === "string" &&
      typeof wish.text === "string" &&
      typeof wish.from === "string" &&
      typeof wish.partyPhone === "string"
  )
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

export function createLocalWeddingRepository(): WeddingRepository {
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
    readParty(phone) {
      return asParty(parseJson(readRaw(`${PARTY_PREFIX}${phone}`), null))
    },
    writeParty(party) {
      writeRaw(`${PARTY_PREFIX}${party.phone}`, JSON.stringify(party))
    },
    readAllParties() {
      const keys = new Set(memory.keys())
      try {
        for (let i = 0; i < window.localStorage.length; i += 1) {
          const key = window.localStorage.key(i)
          if (key) keys.add(key)
        }
      } catch {
        /* localStorage unavailable */
      }
      return [...keys]
        .filter((key) => key.startsWith(PARTY_PREFIX))
        .map((key) => asParty(parseJson(readRaw(key), null)))
        .filter((party): party is Party => party !== null)
    },
    readWishes() {
      return asWishes(parseJson(readRaw(WISH_KEY), [])).slice(-WISH_MAX)
    },
    writeWish(wish) {
      writeRaw(WISH_KEY, JSON.stringify([...asWishes(parseJson(readRaw(WISH_KEY), [])), wish].slice(-WISH_MAX)))
    },
  }
}
