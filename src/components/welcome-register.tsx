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
    <div className="welcome-palette relative min-h-dvh overflow-x-clip">
      <div className="welcome-wash" aria-hidden="true">
        <span className="welcome-wash-sage welcome-wash-sage-a" />
        <span className="welcome-wash-sage welcome-wash-sage-b" />
      </div>
      <PetalField className="z-20" />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[1200px] flex-col items-center justify-center px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] lg:flex-row lg:items-center lg:justify-center lg:gap-8 lg:px-8 lg:py-6">
        <WelcomeScene jumpFrame={frame} />
        <div className="welcome-card relative z-30 mt-3 w-full max-w-lg shrink-0 rounded-[1.35rem] px-6 py-7 lg:mt-0 lg:w-[23rem] lg:max-w-none lg:px-7">
          <p className="welcome-kicker text-center text-[13px] font-medium tracking-[0.22em]">งานมงคลสมรส</p>
          <h1 className="welcome-title mt-2 text-center font-display text-4xl leading-none">
            {COUPLE.groomNickname}
            <span className="welcome-amp px-2 font-serif italic">&</span>
            {COUPLE.brideNickname}
          </h1>
          <p className="welcome-date mt-3 text-center font-serif text-lg">{COUPLE.dateThai}</p>
          <p className="welcome-meta mt-1 text-center text-sm leading-6">
            {VENUE_MAP.name} · {VENUE_MAP.area}
          </p>
          <Button
            type="button"
            disabled={pending}
            className="welcome-cta mt-6 h-12 w-full rounded-xl text-base shadow-none"
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
