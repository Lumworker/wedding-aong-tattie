"use client"

import { useSyncExternalStore } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { RsvpForm } from "@/components/rsvp-form"
import { ROUTES, withQuery } from "@/lib/routes"
import { guestStore } from "@/lib/guest-store"
import type { Party } from "@/lib/types"

export default function RegisterPage() {
  const snapshot = useSyncExternalStore(guestStore.subscribe, guestStore.getSnapshot, guestStore.getServerSnapshot)
  const router = useRouter()
  const searchParams = useSearchParams()
  const search = `?${searchParams.toString()}`
  const phone = snapshot.phone

  if (!phone) return null

  // Only bind saved party for the active phone — changing number never reuses old draft.
  const party = snapshot.party?.phone === phone ? snapshot.party : null

  return (
    <RsvpForm
      key={phone}
      phone={phone}
      party={party}
      onSubmit={async (next: Party) => {
        await guestStore.saveParty(next)
        router.push(withQuery(ROUTES.dashboard, search))
      }}
      onChangePhone={() => {
        guestStore.clearPhone()
        router.push(withQuery(ROUTES.welcome, search))
      }}
    />
  )
}
