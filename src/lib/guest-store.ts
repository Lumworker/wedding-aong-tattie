import { createExcelWeddingRepository, type WeddingRepository } from "@/lib/repository"
import type { Party, Wish } from "@/lib/types"

export type GuestSnapshot = {
  ready: boolean
  phone: string | null
  party: Party | null
  guests: Party["guests"]
  wishes: Wish[]
  error: string | null
}

const EMPTY: GuestSnapshot = {
  ready: false,
  phone: null,
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
    const phone = repo.readSessionPhone()
    try {
      const [parties, wishes] = await Promise.all([repo.readAllParties(), repo.readWishes()])
      return {
        ready: true,
        phone,
        party: phone ? parties.find((party) => party.phone === phone) ?? null : null,
        guests: parties.flatMap((party) => party.guests),
        wishes,
        error: null,
      }
    } catch (error) {
      return {
        ready: true,
        phone,
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
    setPhone(phone: string) {
      repo.writeSessionPhone(phone)
      void refresh()
    },
    clearPhone() {
      repo.clearSessionPhone()
      void refresh()
    },
    async saveParty(party: Party) {
      await repo.writeParty(party)
      repo.writeSessionPhone(party.phone)
      await refresh()
    },
    async deleteRegistration(phone: string) {
      await repo.deleteParty(phone)
      repo.clearSessionPhone()
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
