"use client"

import { useSyncExternalStore } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardView } from "@/components/dashboard/dashboard-view"
import { ROUTES, withQuery } from "@/lib/routes"
import { guestStore } from "@/lib/guest-store"

export default function DashboardPage() {
  const snapshot = useSyncExternalStore(guestStore.subscribe, guestStore.getSnapshot, guestStore.getServerSnapshot)
  const router = useRouter()
  const searchParams = useSearchParams()
  const search = `?${searchParams.toString()}`

  if (!snapshot.phone || !snapshot.party || !snapshot.selfKey) return null

  return (
    <DashboardView
      guests={snapshot.guests}
      wishes={snapshot.wishes}
      phone={snapshot.phone}
      selfKey={snapshot.selfKey}
      party={snapshot.party}
      onEditStep={(step) => {
        const base = withQuery(ROUTES.register, search)
        router.push(`${base}${base.includes("?") ? "&" : "?"}step=${step}`)
      }}
      onEdit={() => {
        const base = withQuery(ROUTES.register, search)
        router.push(`${base}${base.includes("?") ? "&" : "?"}step=review`)
      }}
      onChangePhone={() => {
        guestStore.clearPhone()
        router.push(withQuery(ROUTES.welcome, search))
      }}
      onCancelled={() => router.replace(withQuery(ROUTES.welcome, search))}
    />
  )
}
