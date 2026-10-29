"use client"

import { useRef, useState } from "react"
import { PetalField } from "@/components/petal-field"
import { WelcomeScene } from "@/components/welcome-scene"
import { Button } from "@/components/ui/button"
import { useCoupleJumpPlayback } from "@/components/venue/character"
import { COUPLE, VENUE_MAP } from "@/lib/event"

/** Welcome lawn: invitation card and a single register action. Phone comes later. */
export function WelcomeRegister({ onRegister }: { onRegister: () => void }) {
  const { frame, setLoop, playOnce } = useCoupleJumpPlayback()
  const leaving = useRef(false)
  const [pending, setPending] = useState(false)

  function enter() {
    if (leaving.current) return
    leaving.current = true
    setPending(true)
    playOnce(onRegister)
  }

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-[linear-gradient(180deg,var(--wash)_0%,var(--blush-pale)_100%)]">
      <PetalField className="z-20" />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[1200px] flex-col items-center px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] lg:flex-row lg:items-center lg:justify-center lg:gap-8 lg:px-8 lg:py-6">
        <WelcomeScene jumpFrame={frame} />
        <div className="relative z-30 mt-3 w-full max-w-lg shrink-0 rounded-[1.35rem] border border-border bg-card px-6 py-7 shadow-[0_18px_44px_-24px_rgba(80,48,58,0.35)] lg:mt-0 lg:w-[23rem] lg:max-w-none lg:px-7">
          <p className="text-center text-[13px] font-medium tracking-[0.22em] text-rose">งานมงคลสมรส</p>
          <h1 className="mt-2 text-center font-display text-4xl leading-none text-ink">
            {COUPLE.groomNickname}
            <span className="px-2 font-serif text-rose italic">&</span>
            {COUPLE.brideNickname}
          </h1>
          <p className="mt-3 text-center font-serif text-lg text-ink">{COUPLE.dateThai}</p>
          <p className="mt-1 text-center text-sm leading-6 text-muted-foreground">
            {VENUE_MAP.name} · {VENUE_MAP.area}
          </p>
          <Button
            type="button"
            disabled={pending}
            className="mt-6 h-12 w-full rounded-xl bg-blush text-base text-ink shadow-none hover:bg-rose hover:text-cream focus-visible:border-rose/40 focus-visible:ring-rose/40"
            onPointerEnter={() => setLoop(true)}
            onPointerLeave={() => setLoop(false)}
            onClick={enter}
          >
            {pending ? "กำลังเปิด…" : "ลงทะเบียน"}
          </Button>
        </div>
      </div>
    </div>
  )
}
