import { createLocalWeddingRepository, type WeddingRepository } from "@/lib/repository"
import type { Guest, Party, Wish } from "@/lib/types"

export type GuestSnapshot = {
  /** False during server render and hydration, then true once this browser has been read. */
  ready: boolean
  phone: string | null
  party: Party | null
  guests: Guest[]
  wishes: Wish[]
}

const SERVER_SNAPSHOT: GuestSnapshot = {
  ready: false,
  phone: null,
  party: null,
  guests: [],
  wishes: [],
}

function mergeGuests(parties: Party[]): Guest[] {
  return parties.flatMap((party) => party.guests)
}

/**
 * In-memory store shared by RSVP and the venue.
 * Persistence goes through `WeddingRepository` (localStorage for the MVP).
 * The first client `getSnapshot` reads storage, so the UI can skip a loading effect.
 */
export function createGuestStore(repo: WeddingRepository = createLocalWeddingRepository()) {
  let snapshot: GuestSnapshot = SERVER_SNAPSHOT
  let booted = false
  const listeners = new Set<() => void>()

  function emit(next: GuestSnapshot) {
    snapshot = next
    listeners.forEach((listener) => listener())
  }

  function readClient(): GuestSnapshot {
    const phone = repo.readSessionPhone()
    const party = phone ? repo.readParty(phone) : null
    return {
      ready: true,
      phone,
      party,
      guests: mergeGuests(repo.readAllParties()),
      wishes: repo.readWishes(),
    }
  }

  function boot() {
    if (booted || typeof window === "undefined") return
    booted = true
    snapshot = readClient()
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot() {
      boot()
      return snapshot
    },
    getServerSnapshot() {
      return SERVER_SNAPSHOT
    },
    setPhone(phone: string) {
      repo.writeSessionPhone(phone)
      emit({
        ready: true,
        phone,
        party: repo.readParty(phone),
        guests: mergeGuests(repo.readAllParties()),
        wishes: repo.readWishes(),
      })
    },
    clearPhone() {
      repo.clearSessionPhone()
      emit({
        ready: true,
        phone: null,
        party: null,
        guests: mergeGuests(repo.readAllParties()),
        wishes: repo.readWishes(),
      })
    },
    saveParty(party: Party) {
      repo.writeParty(party)
      repo.writeSessionPhone(party.phone)
      emit({
        ready: true,
        phone: party.phone,
        party,
        guests: mergeGuests(repo.readAllParties()),
        wishes: repo.readWishes(),
      })
    },
    addWish(wish: Wish) {
      repo.writeWish(wish)
      emit({
        ...snapshot,
        ready: true,
        wishes: repo.readWishes(),
      })
    },
  }
}

export const guestStore = createGuestStore()
