"use client"

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react"

export type TourStep = {
  target: RefObject<HTMLElement | null>
  title: string
  text: string
}

type Box = { x: number; y: number; w: number; h: number }

const PAD = 6
const TIP_W = 264
const GAP = 14

/** Spotlight walkthrough. Measures each target on screen, so it follows any layout. */
export function Tour({ steps, step, onNext, onSkip }: { steps: TourStep[]; step: number; onNext: () => void; onSkip: () => void }) {
  const current = step > 0 && step <= steps.length ? steps[step - 1] : null
  const [box, setBox] = useState<Box | null>(null)
  const [vw, setVw] = useState(0)
  const [vh, setVh] = useState(0)
  const nextRef = useRef<HTMLButtonElement>(null)

  useLayoutEffect(() => {
    if (!current) return
    const measure = () => {
      const node = current.target.current
      setVw(window.innerWidth)
      setVh(window.innerHeight)
      if (!node) return setBox(null)
      const rect = node.getBoundingClientRect()
      setBox({ x: rect.left, y: rect.top, w: rect.width, h: rect.height })
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [current])

  useEffect(() => {
    if (!current) return
    nextRef.current?.focus({ preventScroll: true })
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onSkip()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [current, onSkip])

  if (!current || !box) return null

  const below = box.y + box.h / 2 < vh / 2
  const centerX = box.x + box.w / 2
  const left = Math.max(12, Math.min(vw - TIP_W - 12, centerX - TIP_W / 2))
  const arrowLeft = Math.max(14, Math.min(TIP_W - 28, centerX - left - 7))
  const last = step >= steps.length

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed rounded-[10px] border-2 border-white shadow-[0_0_0_9999px_rgba(46,42,39,0.55)] transition-all duration-200"
        style={{ left: box.x - PAD, top: box.y - PAD, width: box.w + PAD * 2, height: box.h + PAD * 2 }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`วิธีใช้งาน ${step} จาก ${steps.length}`}
        className="fixed rounded-xl bg-[#2E2A27] px-3.5 pt-3.5 pb-2.5 text-[#F7F4EE]"
        style={{
          left,
          width: TIP_W,
          ...(below ? { top: box.y + box.h + PAD + GAP } : { bottom: vh - (box.y - PAD - GAP) }),
        }}
      >
        <span
          aria-hidden="true"
          className="absolute size-3.5 rotate-45 bg-[#2E2A27]"
          style={{ left: arrowLeft, ...(below ? { top: -7 } : { bottom: -7 }) }}
        />
        <p className="text-[11px] tracking-wider text-[#F2D4DA]">
          TIP {step}/{steps.length}
        </p>
        <p className="mt-1 text-base font-semibold">{current.title}</p>
        <p className="mt-0.5 text-[13px] leading-normal opacity-90">{current.text}</p>
        <div className="mt-2.5 flex items-center justify-between">
          <button type="button" onClick={onSkip} className="min-h-9 px-1 text-[13px] underline underline-offset-2">
            ข้าม
          </button>
          <button ref={nextRef} type="button" onClick={onNext} className="min-h-9 rounded-md bg-[#F7F4EE] px-4 text-sm font-semibold text-[#2E2A27]">
            {last ? "เข้าใจแล้ว" : "ถัดไป"}
          </button>
        </div>
      </div>
    </div>
  )
}
