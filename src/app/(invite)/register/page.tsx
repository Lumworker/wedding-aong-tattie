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

  if (!snapshot.ready) return null

  // Only bind saved party for the active phone — changing number never reuses old draft.
  const party = phone && snapshot.party?.phone === phone ? snapshot.party : null

  function dropPhoneStep() {
    if (searchParams.get("step") !== "phone") return
    const params = new URLSearchParams(searchParams.toString())
    params.delete("step")
    const qs = params.toString()
    router.replace(withQuery(ROUTES.register, qs ? `?${qs}` : ""))
  }

  return (
    <RsvpForm
      phone={phone}
      party={party}
      startAtPhone={searchParams.get("step") === "phone" || !phone}
      onIdentify={async (nextPhone) => {
        const next = await guestStore.setPhone(nextPhone)
        if (next.party) {
          router.push(withQuery(ROUTES.dashboard, search))
          return "saved"
        }
        dropPhoneStep()
        return "continue"
      }}
      onSubmit={async (next: Party) => {
        await guestStore.saveParty(next)
        router.push(withQuery(ROUTES.dashboard, search))
      }}
      onLeave={() => {
        router.push(withQuery(ROUTES.welcome, search))
      }}
    />
  )
}
