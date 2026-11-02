"use client"

import { useSyncExternalStore } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { RsvpForm, type Stage } from "@/components/rsvp-form"
import { ROUTES, withQuery } from "@/lib/routes"
import { guestStore } from "@/lib/guest-store"
import type { Party } from "@/lib/types"

export default function RegisterPage() {
  const snapshot = useSyncExternalStore(guestStore.subscribe, guestStore.getSnapshot, guestStore.getServerSnapshot)
  const router = useRouter()
  const searchParams = useSearchParams()
  const search = `?${searchParams.toString()}`
  const phone = snapshot.phone
  const urlStep = searchParams.get("step")

  if (!snapshot.ready) return null

  // Only bind saved party for the active phone — changing number never reuses old draft.
  const party = phone && snapshot.party?.phone === phone ? snapshot.party : null

  /** Each step is its own history entry so the device back button walks back one step. */
  function navigate(stage: Stage) {
    const base = withQuery(ROUTES.register, search)
    const join = base.includes("?") ? "&" : "?"
    const target = stage === "intro" ? base : `${base}${join}step=${stage}`
    // Leaving the phone step replaces it: back from step 1 should not reopen the phone form.
    if (urlStep === "phone" && stage !== "phone") router.replace(target)
    else router.push(target)
  }

  return (
    <RsvpForm
      key={phone ?? "anon"}
      phone={phone}
      lastPhone={snapshot.lastPhone}
      party={party}
      urlStep={urlStep}
      onNavigate={navigate}
      onIdentify={async (nextPhone, name) => {
        const { status, snapshot: next } = await guestStore.setPhone(nextPhone, name)
        if (status !== "new" && status !== "verified") return status
        if (next.party) {
          router.push(withQuery(ROUTES.dashboard, search))
          return "saved"
        }
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
