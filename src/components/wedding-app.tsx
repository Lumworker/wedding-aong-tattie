"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { LandingPage } from "@/components/landing-page"
import { PhoneForm } from "@/components/phone-form"
import { RsvpForm } from "@/components/rsvp-form"
import { guestStore } from "@/lib/guest-store"
import type { Party } from "@/lib/types"

type Overlay = "phone" | "rsvp"

const sheet = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 16 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
}

export function WeddingApp() {
  const snapshot = useSyncExternalStore(guestStore.subscribe, guestStore.getSnapshot, guestStore.getServerSnapshot)
  const [overlay, setOverlay] = useState<Overlay | null>(null)

  useEffect(() => {
    document.body.style.overflow = overlay ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [overlay])

  useEffect(() => {
    if (!overlay) return
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOverlay(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [overlay])

  function openRegister() {
    setOverlay(snapshot.phone ? "rsvp" : "phone")
  }

  function continueWithPhone(phone: string) {
    guestStore.setPhone(phone)
    setOverlay("rsvp")
  }

  function saveParty(party: Party) {
    guestStore.saveParty(party)
    setOverlay(null)
  }

  function changePhone() {
    guestStore.clearPhone()
    setOverlay("phone")
  }

  return (
    <div className="relative min-h-dvh bg-background">
      <LandingPage
        guests={snapshot.guests}
        phone={snapshot.phone}
        party={snapshot.party}
        onRegister={openRegister}
      />
      <AnimatePresence>
        {overlay ? (
          <motion.div
            key={overlay}
            role="dialog"
            aria-modal="true"
            aria-label={overlay === "phone" ? "ลงทะเบียนด้วยเบอร์มือถือ" : "ตอบรับคำเชิญ"}
            className="fixed inset-0 z-50 overflow-y-auto bg-background/92 backdrop-blur-md"
            {...sheet}
          >
            {overlay === "phone" ? (
              <PhoneForm onContinue={continueWithPhone} onClose={() => setOverlay(null)} />
            ) : snapshot.phone ? (
              <RsvpForm
                key={`${snapshot.phone}:${snapshot.party?.updatedAt ?? "new"}`}
                phone={snapshot.phone}
                party={snapshot.party}
                onSubmit={saveParty}
                onChangePhone={changePhone}
                onClose={() => setOverlay(null)}
              />
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
