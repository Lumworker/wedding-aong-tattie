"use client"

import { useState, useSyncExternalStore } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { PhoneForm } from "@/components/phone-form"
import { RsvpForm } from "@/components/rsvp-form"
import { VenueScene } from "@/components/venue/venue-scene"
import { guestStore } from "@/lib/guest-store"
import type { Party } from "@/lib/types"

type View = "phone" | "rsvp" | "venue"

const page = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
}

function Splash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-5xl text-rose italic motion-safe:animate-pulse">C & P</p>
      <p className="mt-4 text-sm text-muted-foreground">กำลังเปิดคำเชิญ</p>
    </div>
  )
}

export function WeddingApp() {
  const snapshot = useSyncExternalStore(guestStore.subscribe, guestStore.getSnapshot, guestStore.getServerSnapshot)
  const [override, setOverride] = useState<View | null>(null)
  const auto: View = snapshot.phone && snapshot.party ? "venue" : snapshot.phone ? "rsvp" : "phone"
  const view = override ?? auto

  function continueWithPhone(phone: string) {
    guestStore.setPhone(phone)
    setOverride(null)
  }

  function saveParty(party: Party) {
    guestStore.saveParty(party)
    setOverride(null)
  }

  function changePhone() {
    guestStore.clearPhone()
    setOverride(null)
  }

  return (
    <div className="relative min-h-dvh bg-background">
      <AnimatePresence mode="wait" initial={false}>
        {!snapshot.ready ? (
          <motion.div key="splash" {...page}>
            <Splash />
          </motion.div>
        ) : null}
        {snapshot.ready && view === "phone" ? (
          <motion.div key="phone" {...page}>
            <PhoneForm onContinue={continueWithPhone} />
          </motion.div>
        ) : null}
        {snapshot.ready && view === "rsvp" && snapshot.phone ? (
          <motion.div key="rsvp" {...page}>
            <RsvpForm
              key={`${snapshot.phone}:${snapshot.party?.updatedAt ?? "new"}`}
              phone={snapshot.phone}
              party={snapshot.party}
              onSubmit={saveParty}
              onChangePhone={changePhone}
            />
          </motion.div>
        ) : null}
        {snapshot.ready && view === "venue" && snapshot.phone ? (
          <motion.div key="venue" {...page}>
            <VenueScene
              guests={snapshot.guests}
              phone={snapshot.phone}
              onEdit={() => setOverride("rsvp")}
              onChangePhone={changePhone}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
