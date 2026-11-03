"use client"

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react"

export type TourStep = {
  target: RefObject<HTMLElement | null>
  title: string
  text: string
  icon?: ReactNode
  /** Corner radius of the highlight; 999 for pills. */
  radius?: number
  /** The guest may tap the target itself; that taps it for real and moves on. */
  tapToContinue?: boolean
}

type Box = { x: number; y: number; w: number; h: number }

const PAD = 4
const TIP_MAX = 300
const GAP = 14
/** Time to let the couple wave before the next step when the guest taps them. */
const TAP_ADVANCE_MS = 1300

/**
 * Coach marks (v2.4): forest scrim, a cream ring on the target, and a cream card
 * with an icon, step dots, "ข้าม" and a forest "ถัดไป" / "เริ่มเลย".
 * Measures each target on screen, so it follows any layout.
 */
export function Tour({ steps, step, onNext, onSkip }: { steps: TourStep[]; step: number; onNext: () => void; onSkip: () => void }) {
  const current = step > 0 && step <= steps.length ? steps[step - 1] : null
  const [box, setBox] = useState<Box | null>(null)
  const [view, setView] = useState({ w: 0, h: 0 })
  const [cardH, setCardH] = useState(0)
  const nextRef = useRef<HTMLButtonElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const advance = useRef<number | undefined>(undefined)

  useLayoutEffect(() => {
    if (!current) return
    const measure = () => {
      const node = current.target.current
      setView({ w: window.innerWidth, h: window.innerHeight })
      if (!node) return setBox(null)
      const rect = node.getBoundingClientRect()
      setBox({ x: rect.left, y: rect.top, w: rect.width, h: rect.height })
    }
    current.target.current?.scrollIntoView?.({ block: "nearest" })
    measure()
    window.addEventListener("resize", measure)
    window.addEventListener("scroll", measure, true)
    return () => {
      window.removeEventListener("resize", measure)
      window.removeEventListener("scroll", measure, true)
    }
  }, [current])

  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight)
  }, [current, box])

  useEffect(() => {
    if (!current) return
    nextRef.current?.focus({ preventScroll: true })
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onSkip()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.clearTimeout(advance.current)
    }
  }, [current, onSkip])

  if (!current || !box) return null

  const last = step >= steps.length
  const radius = current.radius ?? 16
  const tipW = Math.min(TIP_MAX, view.w - 24)
  const centerX = box.x + box.w / 2
  const left = Math.max(12, Math.min(view.w - tipW - 12, centerX - tipW / 2))
  const arrowLeft = Math.max(18, Math.min(tipW - 32, centerX - left - 7))
  const spaceBelow = view.h - (box.y + box.h + PAD + GAP)
  const below = spaceBelow >= cardH || box.y - PAD - GAP < cardH

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Blocks the page; only the card (and the target on a tap step) take taps. */}
      <div aria-hidden="true" className="fixed inset-0" />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed border-2 border-[#FFF8E6] shadow-[0_0_0_9999px_rgba(38,58,45,0.58)] transition-all duration-300 motion-reduce:transition-none"
        style={{
          left: box.x - PAD,
          top: box.y - PAD,
          width: box.w + PAD * 2,
          height: box.h + PAD * 2,
          borderRadius: radius >= 999 ? 999 : radius + PAD,
        }}
      />
      {current.tapToContinue ? (
        <button
          type="button"
          aria-label={current.title}
          className="fixed cursor-pointer bg-transparent"
          style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
          onClick={() => {
            current.target.current?.click()
            window.clearTimeout(advance.current)
            advance.current = window.setTimeout(onNext, TAP_ADVANCE_MS)
          }}
        />
      ) : null}
      <div
        ref={cardRef}
        key={step}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-text"
        className="tour-in fixed rounded-[18px] border border-[#E6DCC4] bg-[#FFFCF5] px-3.5 pt-3.5 pb-3 text-[#2E4535] shadow-[0_18px_40px_-18px_rgba(20,35,26,0.55)]"
        style={{
          left,
          width: tipW,
          ...(below ? { top: box.y + box.h + PAD + GAP } : { bottom: view.h - (box.y - PAD - GAP) }),
        }}
      >
        <span
          aria-hidden="true"
          className={`absolute size-3.5 rotate-45 bg-[#FFFCF5] ${
            below ? "-top-2 border-t border-l border-[#E6DCC4]" : "-bottom-2 border-r border-b border-[#E6DCC4]"
          }`}
          style={{ left: arrowLeft }}
        />
        <div className="mb-1.5 flex items-center gap-2">
          {current.icon ? (
            <span aria-hidden="true" className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-[#F2D9D3] text-[#A8665A]">
              {current.icon}
            </span>
          ) : null}
          <p id="tour-title" className="text-base leading-snug font-medium">
            {current.title}
          </p>
        </div>
        <p id="tour-text" className="mb-3 text-[13.5px] leading-relaxed text-[#5B6B5F]">
          {current.text}
        </p>
        {current.tapToContinue ? (
          <p className="-mt-1 mb-2.5 flex items-center gap-1.5 text-xs text-[#A8665A]">
            <span aria-hidden="true" className="tour-pulse size-2 rounded-full bg-[#E0AFA6]" />
            ลองแตะดูเลย
          </p>
        ) : null}
        <div className="flex items-center gap-2.5">
          <div className="flex flex-1 gap-[5px]" aria-label={`ขั้นที่ ${step} จาก ${steps.length}`}>
            {steps.map((_, index) => (
              <span
                key={index}
                aria-hidden="true"
                className={`block h-[7px] rounded-full ${index === step - 1 ? "w-[18px] bg-[#E0AFA6]" : "w-[7px] bg-[#CCCDB0]"}`}
              />
            ))}
          </div>
          {last ? null : (
            <button type="button" onClick={onSkip} className="h-11 px-1.5 text-[13px] text-[#5B6B5F]">
              ข้าม
            </button>
          )}
          <button
            ref={nextRef}
            type="button"
            onClick={() => {
              window.clearTimeout(advance.current)
              onNext()
            }}
            className="h-11 rounded-full bg-[#2E4535] px-[18px] text-sm font-medium text-[#F6F1E8] hover:bg-[#22352A]"
          >
            {last ? "เริ่มเลย" : "ถัดไป"}
          </button>
        </div>
      </div>
    </div>
  )
}
