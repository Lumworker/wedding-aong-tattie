import { createExcelWeddingRepository, type SessionStatus, type WeddingRepository } from "@/lib/repository"
import type { Party, Wish } from "@/lib/types"

export type GuestSnapshot = {
  ready: boolean
  /** Server-verified phone (cookie session). Null until the guest proves it. */
  phone: string | null
  /** This party's opaque key in `guests` / `wishes`. */
  selfKey: string | null
  /** Last phone typed on this device, for prefilling. */
  lastPhone: string | null
  party: Party | null
  guests: Party["guests"]
  wishes: Wish[]
  error: string | null
}

const EMPTY: GuestSnapshot = {
  ready: false,
  phone: null,
  selfKey: null,
  lastPhone: null,
  party: null,
  guests: [],
  wishes: [],
  error: null,
}

export function createGuestStore(repo: WeddingRepository = createExcelWeddingRepository()) {
  let snapshot: GuestSnapshot = EMPTY
  let booted = false
  let bootPromise: Promise<void> | null = null
  const listeners = new Set<() => void>()

  function emit(next: GuestSnapshot) {
    snapshot = next
    listeners.forEach((listener) => listener())
  }

  async function load(): Promise<GuestSnapshot> {
    const lastPhone = repo.readSessionPhone()
    try {
      const [session, guests, wishes] = await Promise.all([
        repo.readSession(),
        repo.readAllGuests(),
        repo.readWishes(),
      ])
      return {
        ready: true,
        phone: session?.phone ?? null,
        selfKey: session?.selfKey ?? null,
        lastPhone,
        party: session?.party ?? null,
        guests,
        wishes,
        error: null,
      }
    } catch (error) {
      return {
        ready: true,
        phone: null,
        selfKey: null,
        lastPhone,
        party: null,
        guests: [],
        wishes: [],
        error: error instanceof Error ? error.message : "โหลดข้อมูลไม่สำเร็จ",
      }
    }
  }

  async function refresh() {
    emit(await load())
  }

  function ensureBoot() {
    if (booted || typeof window === "undefined") return
    if (bootPromise) return
    bootPromise = load().then((next) => {
      booted = true
      emit(next)
    })
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot() {
      ensureBoot()
      return snapshot
    },
    getServerSnapshot() {
      return EMPTY
    },
    /** Start a server session. A phone with a saved party needs the saved name too. */
    async setPhone(phone: string, name?: string): Promise<{ status: SessionStatus; snapshot: GuestSnapshot }> {
      const { status, session } = await repo.startSession(phone, name)
      if (!session) return { status, snapshot }
      repo.writeSessionPhone(phone)
      const next = await load()
      emit(next)
      return { status, snapshot: next }
    },
    clearPhone() {
      repo.clearSessionPhone()
      void repo.endSession().finally(() => void refresh())
    },
    async saveParty(party: Party) {
      await repo.writeParty(party)
      await refresh()
    },
    async deleteRegistration(phone: string) {
      await repo.deleteParty(phone)
      repo.clearSessionPhone()
      await repo.endSession()
      await refresh()
    },
    async addWish(wish: Wish) {
      await repo.writeWish(wish)
      await refresh()
    },
    async updateWish(wish: Wish) {
      await repo.updateWish(wish)
      await refresh()
    },
    async seedMocks() {
      const response = await fetch("/api/mock", { method: "POST" })
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error || "สร้างข้อมูล mock ไม่สำเร็จ")
      }
      await refresh()
    },
  }
}

export const guestStore = createGuestStore()
