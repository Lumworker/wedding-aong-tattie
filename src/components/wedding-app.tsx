"use client"

import { useState, useSyncExternalStore, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { PhoneForm } from "@/components/phone-form"
import { RsvpForm } from "@/components/rsvp-form"
import { VenueScene } from "@/components/venue/venue-scene"
import { guestStore } from "@/lib/guest-store"
import type { Party } from "@/lib/types"

type View = "phone" | "rsvp" | "venue"

const fade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
}

function Screen({ children }: { children: ReactNode }) {
  return <motion.div {...fade}>{children}</motion.div>
}

export function WeddingApp() {
  const snapshot = useSyncExternalStore(guestStore.subscribe, guestStore.getSnapshot, guestStore.getServerSnapshot)
  const [override, setOverride] = useState<View | null>(null)
  const view = override ?? (snapshot.phone ? "rsvp" : "phone")

  return (
    <div className="relative min-h-dvh bg-background">
      <AnimatePresence mode="wait" initial={false}>
        {!snapshot.ready ? (
          <Screen key="splash">
            <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
              <p className="font-display text-5xl text-rose italic motion-safe:animate-pulse">C & P</p>
              <p className="mt-4 text-sm text-muted-foreground">กำลังเปิดคำเชิญ</p>
            </div>
          </Screen>
        ) : null}
        {snapshot.ready && view === "phone" ? (
          <Screen key="phone">
            <PhoneForm
              onContinue={(phone) => {
                guestStore.setPhone(phone)
                setOverride("rsvp")
              }}
            />
          </Screen>
        ) : null}
        {snapshot.ready && view === "rsvp" && snapshot.phone ? (
          <Screen key="rsvp">
            <RsvpForm
              key={`${snapshot.phone}:${snapshot.party?.updatedAt ?? "new"}`}
              phone={snapshot.phone}
              party={snapshot.party}
              onSubmit={(party: Party) => {
                guestStore.saveParty(party)
                setOverride("venue")
              }}
              onChangePhone={() => {
                guestStore.clearPhone()
                setOverride(null)
              }}
            />
          </Screen>
        ) : null}
        {snapshot.ready && view === "venue" && snapshot.phone ? (
          <Screen key="venue">
            <VenueScene
              guests={snapshot.guests}
              wishes={snapshot.wishes}
              phone={snapshot.phone}
              onEdit={() => setOverride("rsvp")}
              onChangePhone={() => {
                guestStore.clearPhone()
                setOverride(null)
              }}
            />
          </Screen>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
