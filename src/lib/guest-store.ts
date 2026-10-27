import { createLocalWeddingRepository, type WeddingRepository } from "@/lib/repository"
import { SEED_GUESTS } from "@/lib/seed-guests"
import type { Guest, Party } from "@/lib/types"

export type GuestSnapshot = {
  /** False during server render and hydration, then true once this browser has been read. */
  ready: boolean
  phone: string | null
  party: Party | null
  guests: Guest[]
}

const SERVER_SNAPSHOT: GuestSnapshot = {
  ready: false,
  phone: null,
  party: null,
  guests: SEED_GUESTS,
}

function mergeGuests(parties: Party[]): Guest[] {
  return [...SEED_GUESTS, ...parties.flatMap((party) => party.guests)]
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
      })
    },
    clearPhone() {
      repo.clearSessionPhone()
      emit({
        ready: true,
        phone: null,
        party: null,
        guests: mergeGuests(repo.readAllParties()),
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
      })
    },
  }
}

export const guestStore = createGuestStore()
