"use client"

import { useSyncExternalStore } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { VenueScene } from "@/components/venue/venue-scene"
import { ROUTES, withQuery } from "@/lib/routes"
import { guestStore } from "@/lib/guest-store"

export default function DashboardPage() {
  const snapshot = useSyncExternalStore(guestStore.subscribe, guestStore.getSnapshot, guestStore.getServerSnapshot)
  const router = useRouter()
  const searchParams = useSearchParams()
  const search = `?${searchParams.toString()}`

  if (!snapshot.phone || !snapshot.party) return null

  return (
    <VenueScene
      guests={snapshot.guests}
      wishes={snapshot.wishes}
      phone={snapshot.phone}
      onEdit={() => router.push(withQuery(ROUTES.register, search))}
      onChangePhone={() => {
        guestStore.clearPhone()
        router.push(withQuery(ROUTES.welcome, search))
      }}
    />
  )
}
