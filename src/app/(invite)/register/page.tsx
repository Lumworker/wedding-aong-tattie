"use client"

import { useSyncExternalStore } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { RegisterFlow, type Stage } from "@/components/register/register-flow"
import { ROUTES, withQuery } from "@/lib/routes"
import { guestStore } from "@/lib/guest-store"
import { newId } from "@/lib/id"
import type { Party } from "@/lib/types"

/** Old `?step=` values (stepper v2) still land on the matching v2.3 screen. */
const LEGACY_STEP: Record<string, Stage> = { phone: "start", attend: "start", about: "who", review: "who" }

export default function RegisterPage() {
  const snapshot = useSyncExternalStore(guestStore.subscribe, guestStore.getSnapshot, guestStore.getServerSnapshot)
  const router = useRouter()
  const searchParams = useSearchParams()
  const search = `?${searchParams.toString()}`
  const phone = snapshot.phone
  const rawStep = searchParams.get("step")
  const urlStep = rawStep ? (LEGACY_STEP[rawStep] ?? rawStep) : null

  if (!snapshot.ready) return null

  // Only bind the saved party for the active phone — a new number never reuses an old draft.
  const party = phone && snapshot.party?.phone === phone ? snapshot.party : null

  /** Each step is its own history entry so the device back button walks back one step. */
  function navigate(stage: Stage, replace = false) {
    const base = withQuery(ROUTES.register, search)
    const target = `${base}${base.includes("?") ? "&" : "?"}step=${stage}`
    if (replace) router.replace(target)
    else router.push(target)
  }

  return (
    <RegisterFlow
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
      onSubmit={(next: Party) => guestStore.saveParty(next)}
      onSendLetter={async (from, text) => {
        if (!phone) return
        await guestStore.addWish({ id: newId("wish"), text, from, partyPhone: phone, createdAt: new Date().toISOString() })
      }}
      onDone={() => router.push(withQuery(ROUTES.dashboard, search))}
      onLeave={() => router.push(withQuery(ROUTES.welcome, search))}
    />
  )
}
