"use client"

import { useEffect, useRef, useState } from "react"
import { PetalField } from "@/components/petal-field"
import { WelcomeScene } from "@/components/welcome-scene"
import { Button } from "@/components/ui/button"
import { useCoupleJumpPlayback } from "@/components/venue/character"
import { COUPLE_JUMP } from "@/lib/couple-atlas"
import { COUPLE, VENUE_MAP } from "@/lib/event"

/**
 * Jump strips are not in the scene until the register hover. Hold the decoded
 * images so that first hop does not wait on the PNG.
 */
const warmedJumpSheets: HTMLImageElement[] = []

function warmCoupleJumpSheets() {
  if (warmedJumpSheets.length > 0) return
  for (const src of [COUPLE_JUMP.groom, COUPLE_JUMP.bride]) {
    const image = new Image()
    image.decoding = "async"
    image.src = src
    void image.decode().catch(() => {})
    warmedJumpSheets.push(image)
  }
}

/** Welcome lawn: invitation card and a single register action. Phone comes later. */
export function WelcomeRegister({ onRegister }: { onRegister: () => void }) {
  const { frame, setLoop, playOnce } = useCoupleJumpPlayback()
  const leaving = useRef(false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    warmCoupleJumpSheets()
  }, [])

  function enter() {
    if (leaving.current) return
    leaving.current = true
    setPending(true)
    playOnce(onRegister)
  }

  return (
    <div className="welcome-palette relative min-h-dvh overflow-x-clip">
      <img src="/sprites/welcome-landscape.png?v=5" alt="" className="welcome-landscape" />
      <PetalField className="z-20" />
      <WelcomeScene jumpFrame={frame} />
      <div className="relative z-30 mx-auto flex min-h-dvh w-full max-w-[1200px] flex-col items-center justify-end px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] lg:items-end lg:justify-center lg:px-10 lg:py-8">
        <div className="welcome-card w-full max-w-lg shrink-0 rounded-[1.35rem] px-6 py-7 lg:w-[23rem] lg:max-w-none lg:px-7">
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
