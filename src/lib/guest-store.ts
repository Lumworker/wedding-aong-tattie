import { createLocalWeddingRepository, type WeddingRepository } from "@/lib/repository"
import type { Party, Wish } from "@/lib/types"

export type GuestSnapshot = {
  ready: boolean
  phone: string | null
  party: Party | null
  guests: Party["guests"]
  wishes: Wish[]
}

const EMPTY: GuestSnapshot = {
  ready: false,
  phone: null,
  party: null,
  guests: [],
  wishes: [],
}

export function createGuestStore(repo: WeddingRepository = createLocalWeddingRepository()) {
  let snapshot: GuestSnapshot = EMPTY
  let booted = false
  const listeners = new Set<() => void>()

  function read(): GuestSnapshot {
    const phone = repo.readSessionPhone()
    const parties = repo.readAllParties()
    return {
      ready: true,
      phone,
      party: phone ? repo.readParty(phone) : null,
      guests: parties.flatMap((party) => party.guests),
      wishes: repo.readWishes(),
    }
  }

  function emit(next: GuestSnapshot) {
    snapshot = next
    listeners.forEach((listener) => listener())
  }

  function refresh() {
    emit(read())
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot() {
      if (!booted && typeof window !== "undefined") {
        booted = true
        snapshot = read()
      }
      return snapshot
    },
    getServerSnapshot() {
      return EMPTY
    },
    setPhone(phone: string) {
      repo.writeSessionPhone(phone)
      refresh()
    },
    clearPhone() {
      repo.clearSessionPhone()
      refresh()
    },
    saveParty(party: Party) {
      repo.writeParty(party)
      repo.writeSessionPhone(party.phone)
      refresh()
    },
    addWish(wish: Wish) {
      repo.writeWish(wish)
      refresh()
    },
  }
}

export const guestStore = createGuestStore()
