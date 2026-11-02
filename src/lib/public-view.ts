import { partyKey } from "@/lib/guest-session"
import type { Guest, Party, Wish } from "@/lib/types"

/**
 * What every browser may see. `partyPhone` is replaced by an opaque party key,
 * so the scene can still group a party and spot "mine" without leaking numbers.
 */
export function publicGuests(parties: Party[]): Guest[] {
  return parties.flatMap((party) => {
    const key = partyKey(party.phone)
    return party.guests.map((guest) => ({
      id: guest.id,
      name: guest.name,
      gender: guest.gender,
      ageGroup: guest.ageGroup,
      attendance: guest.attendance,
      ...(guest.side ? { side: guest.side } : {}),
      partyPhone: key,
      ...(guest.isCompanion ? { isCompanion: true } : {}),
    }))
  })
}

export function publicWishes(wishes: Wish[]): Wish[] {
  return wishes.map((wish) => ({ ...wish, partyPhone: partyKey(wish.partyPhone) }))
}

