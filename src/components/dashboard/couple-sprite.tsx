"use client"

import { useEffect, useState } from "react"
import { COUPLE_IDLE, COUPLE_READ, COUPLE_WAVE, coupleReadOrigin, coupleWaveOrigin } from "@/lib/couple-atlas"

export type CoupleRole = "groom" | "bride"
export type CoupleMode = "idle" | "wave" | "read"

function prefersReducedMotion() {
  if (typeof window === "undefined") return false
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
}

/** Frame sequence + per-frame hold for one wave play: `cycles` passes, then the settle frame. */
function waveSteps() {
  const steps: { frame: number; ms: number }[] = []
  for (let cycle = 0; cycle < COUPLE_WAVE.cycles; cycle += 1) {
    COUPLE_WAVE.frameMs.forEach((ms, frame) => steps.push({ frame, ms }))
  }
  steps.push({ frame: COUPLE_WAVE.settleFrame, ms: COUPLE_WAVE.settleMs })
  return steps
}

/**
 * One member of the couple on the balcony. Idle uses the locked portrait; wave and
 * read step through their strips with the timings from couple-atlas (not changed here).
 * Key it by mode + playKey so a new play restarts from the first frame.
 */
export function CoupleSprite({
  role,
  mode,
  playKey,
  size,
  onWaveDone,
}: {
  role: CoupleRole
  mode: CoupleMode
  playKey: number
  /** Drawn cell size in stage px (the art is 256px square). */
  size: number
  onWaveDone?: () => void
}) {
  // The parent keys this component by mode + playKey, so every play starts from a fresh state.
  const [frame, setFrame] = useState(() => (mode === "read" && prefersReducedMotion() ? COUPLE_READ.frames - 1 : 0))

  useEffect(() => {
    if (mode === "idle") return
    const reduced = prefersReducedMotion()
    const timers: number[] = []
    if (mode === "read") {
      if (reduced) return
      let at = 0
      COUPLE_READ.frameMs.forEach((ms, index) => {
        at += ms
        timers.push(window.setTimeout(() => setFrame(index + 1), at))
      })
    } else {
      if (reduced) {
        timers.push(window.setTimeout(() => onWaveDone?.(), 900))
        return () => timers.forEach((id) => window.clearTimeout(id))
      }
      const steps = waveSteps()
      let at = 0
      steps.forEach((step, index) => {
        at += step.ms
        const next = steps[index + 1]
        timers.push(window.setTimeout(() => (next ? setFrame(next.frame) : onWaveDone?.()), at))
      })
    }
    return () => timers.forEach((id) => window.clearTimeout(id))
    // onWaveDone is a fresh closure each render; restarting on it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, playKey])

  if (mode === "idle") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={COUPLE_IDLE[role]}
        alt=""
        width={size}
        height={size}
        draggable={false}
        style={{ width: size, height: size, imageRendering: "pixelated" }}
      />
    )
  }

  const sheet = mode === "wave" ? COUPLE_WAVE : COUPLE_READ
  const origin = mode === "wave" ? coupleWaveOrigin(frame) : coupleReadOrigin(frame)
  const scale = size / sheet.frame
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${sheet[role]})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${sheet.width * scale}px ${sheet.height * scale}px`,
        backgroundPosition: `${-origin * scale}px ${-sheet.gutter * scale}px`,
        imageRendering: "pixelated",
      }}
    />
  )
}
