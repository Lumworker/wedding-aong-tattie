"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useReducedMotion } from "framer-motion"
import { spriteForGuest } from "@/lib/appearance"
import { COUPLE_IDLE, COUPLE_JUMP, COUPLE_WAVE, coupleJumpOrigin, coupleWaveOrigin } from "@/lib/couple-atlas"
import { COUPLE } from "@/lib/event"
import type { Guest } from "@/lib/types"

/** Square chibi frame, sized to sit on the altar without covering the aisle. */
const COUPLE_SIZE = 56

/** Idle most of the time, then a short two-cycle wave. `delayMs` staggers the pair. */
function useAltarWave(active: boolean, delayMs: number) {
  const reduced = useReducedMotion() === true
  const [frame, setFrame] = useState<number | null>(null)

  useEffect(() => {
    if (!active || reduced) return

    let wait = 0
    let tick = 0
    let stopped = false

    const play = () => {
      if (stopped) return
      let step = 0
      const total = COUPLE_WAVE.frames * COUPLE_WAVE.cycles
      setFrame(0)
      tick = window.setInterval(() => {
        step += 1
        if (step >= total) {
          window.clearInterval(tick)
          setFrame(null)
          wait = window.setTimeout(play, COUPLE_WAVE.pauseMs)
          return
        }
        setFrame(step % COUPLE_WAVE.frames)
      }, COUPLE_WAVE.frameMs)
    }

    wait = window.setTimeout(play, 2400 + delayMs)
    return () => {
      stopped = true
      window.clearTimeout(wait)
      window.clearInterval(tick)
    }
  }, [active, delayMs, reduced])

  if (!active || reduced) return null
  return frame
}

/**
 * Register CTA playback. Hover loops the hop. A click finishes the current
 * cycle (or starts one) and calls back when the land frame ends.
 * Reduced motion stays idle and completes immediately.
 */
export function useCoupleJumpPlayback() {
  const reduced = useReducedMotion() === true
  const [frame, setFrame] = useState<number | null>(null)
  const loopRef = useRef(false)
  const onceRef = useRef<(() => void) | null>(null)
  const timerRef = useRef(0)
  const runningRef = useRef(false)
  const stepRef = useRef(0)
  const mountedRef = useRef(true)

  const stopTimer = useCallback(() => {
    window.clearInterval(timerRef.current)
    timerRef.current = 0
    runningRef.current = false
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      stopTimer()
    }
  }, [stopTimer])

  useEffect(() => {
    if (!reduced) return
    onceRef.current = null
    loopRef.current = false
    stopTimer()
  }, [reduced, stopTimer])

  const start = useCallback(() => {
    if (runningRef.current || reduced) return
    runningRef.current = true
    stepRef.current = 0
    setFrame(0)
    timerRef.current = window.setInterval(() => {
      stepRef.current += 1
      if (stepRef.current < COUPLE_JUMP.frames) {
        setFrame(stepRef.current)
        return
      }
      const done = onceRef.current
      onceRef.current = null
      if (done || !loopRef.current) {
        stopTimer()
        stepRef.current = 0
        setFrame(null)
        if (done && mountedRef.current) done()
        return
      }
      stepRef.current = 0
      setFrame(0)
    }, COUPLE_JUMP.frameMs)
  }, [reduced, stopTimer])

  const setLoop = useCallback(
    (on: boolean) => {
      if (reduced || onceRef.current) return
      loopRef.current = on
      if (on) {
        start()
        return
      }
      stopTimer()
      stepRef.current = 0
      setFrame(null)
    },
    [reduced, start, stopTimer]
  )

  const playOnce = useCallback(
    (onDone: () => void) => {
      if (reduced) {
        onDone()
        return
      }
      if (onceRef.current) return
      loopRef.current = false
      onceRef.current = onDone
      if (!runningRef.current) start()
    },
    [reduced, start]
  )

  return { frame: reduced ? null : frame, setLoop, playOnce }
}

/** Play the 6-frame jump once per `playId`. `0` and reduced motion stay idle. */
export function useCoupleJump(playId: number) {
  const reduced = useReducedMotion() === true
  const [played, setPlayed] = useState<{ id: number; frame: number | null }>({ id: 0, frame: null })

  useEffect(() => {
    if (playId === 0 || reduced) return

    let step = 0
    let tick = 0
    const start = window.setTimeout(() => {
      setPlayed({ id: playId, frame: 0 })
      tick = window.setInterval(() => {
        step += 1
        if (step >= COUPLE_JUMP.frames) {
          window.clearInterval(tick)
          setPlayed({ id: playId, frame: null })
          return
        }
        setPlayed({ id: playId, frame: step })
      }, COUPLE_JUMP.frameMs)
    }, 0)

    return () => {
      window.clearTimeout(start)
      window.clearInterval(tick)
    }
  }, [playId, reduced])

  if (reduced || playId === 0 || played.id !== playId) return null
  return played.frame
}

export type FigureRole = "guest" | "groom" | "bride"
export type FigureMood = "idle" | "walk" | "cheer" | "sit"

function Nameplate({
  label,
  y,
  highlight,
  hero = false,
}: {
  label: string
  y: number
  highlight: boolean
  hero?: boolean
}) {
  const glyphs = Array.from(label)
  const shown = glyphs.length > 14 ? `${glyphs.slice(0, 13).join("")}…` : label
  const width = Math.max(hero ? 42 : 34, Array.from(shown).length * 6.4 + 12)
  return (
    <g transform={`translate(0 ${y})`}>
      <rect x={-width / 2 + 2} y={-6} width={width} height={15} fill="#05040A" opacity="0.55" />
      <rect
        x={-width / 2}
        y={-8}
        width={width}
        height={15}
        fill={highlight || hero ? "#16141F" : "#121018"}
        stroke={highlight || hero ? "#E8C878" : "#6A5A44"}
        strokeWidth={hero ? 1.4 : 1}
      />
      <text
        y="0.5"
        textAnchor="middle"
        dominantBaseline="central"
        fill={highlight || hero ? "#F8E2B8" : "#E8DCC8"}
        fontSize={hero ? 10 : 8}
      >
        {shown}
      </text>
    </g>
  )
}

function PixelCouple({
  href,
  waveHref,
  waveFrame,
  jumpHref,
  jumpFrame,
  label,
  showName,
  size,
}: {
  href: string
  waveHref?: string
  waveFrame: number | null
  jumpHref?: string
  jumpFrame: number | null
  label: string
  showName: boolean
  size: number
}) {
  const jumping = jumpFrame !== null && Boolean(jumpHref)
  const waving = !jumping && waveFrame !== null && Boolean(waveHref)
  const drawW = size
  const drawH = jumping ? size * (COUPLE_JUMP.frameH / COUPLE_JUMP.frameW) : size
  const pose = jumping && jumpFrame > 0 ? "is-jumping" : "is-idle"

  return (
    <g>
      {label ? <title>{label}</title> : null}
      <ellipse cx="2" cy="4" rx={size * 0.22} ry="3.2" fill="#05040A" opacity="0.5" />
      <g className={pose}>
        <g className="wd-bob">
          {jumping ? (
            <svg
              x={-drawW / 2}
              y={-drawH}
              width={drawW}
              height={drawH}
              viewBox={`${coupleJumpOrigin(jumpFrame)} 0 ${COUPLE_JUMP.frameW} ${COUPLE_JUMP.frameH}`}
              overflow="hidden"
            >
              <image
                href={jumpHref}
                width={COUPLE_JUMP.width}
                height={COUPLE_JUMP.height}
                style={{ imageRendering: "pixelated" }}
              />
            </svg>
          ) : waving ? (
            <svg
              x={-size / 2}
              y={-size}
              width={size}
              height={size}
              viewBox={`${coupleWaveOrigin(waveFrame)} ${COUPLE_WAVE.gutter} ${COUPLE_WAVE.frame} ${COUPLE_WAVE.frame}`}
              overflow="hidden"
            >
              <image
                href={waveHref}
                width={COUPLE_WAVE.width}
                height={COUPLE_WAVE.height}
                style={{ imageRendering: "pixelated" }}
              />
            </svg>
          ) : (
            <image
              href={href}
              x={-size / 2}
              y={-size}
              width={size}
              height={size}
              style={{ imageRendering: "pixelated" }}
            />
          )}
        </g>
      </g>
      {showName && label ? <Nameplate label={label} y={-drawH - 8} highlight hero /> : null}
    </g>
  )
}

function AtlasGuest({
  guest,
  mood,
  showName,
  highlight,
  facing,
  frame = 0,
}: {
  guest: Guest
  mood: FigureMood
  showName: boolean
  highlight: boolean
  facing: 1 | -1
  frame?: number
}) {
  const sprite = spriteForGuest(guest)
  const { atlas } = sprite
  const sitting = mood === "sit"
  const walking = mood === "walk"
  const frameIndex = walking ? frame % atlas.frames : 0
  const sx = (sprite.col * atlas.frames + frameIndex) * atlas.frameW
  const sy = sprite.row * atlas.frameH
  const width = atlas.frameW * atlas.pixel
  const height = atlas.frameH * atlas.pixel
  const drawFacing = (facing * atlas.artFacing) as 1 | -1
  const moodClass = walking ? "is-walking" : mood === "cheer" ? "is-cheering" : sitting ? "is-sitting" : "is-idle"
  const label = guest.name
  const shadow = guest.isCompanion ? 6 : 9

  return (
    <g>
      {label ? <title>{label}</title> : null}
      {showName && label ? <Nameplate label={label} y={-height - 6} highlight={highlight} /> : null}
      <g transform={`scale(${drawFacing} 1)`}>
        <ellipse cx="1" cy="2" rx={highlight ? 11 : shadow} ry="2.4" fill="#05040A" opacity="0.45" />
        {highlight ? (
          <ellipse cx="0" cy={-height / 2} rx={width * 0.55} ry={height * 0.42} fill="none" stroke="#E8C878" strokeWidth="1.2" className="wd-ring" />
        ) : null}
        <g className={moodClass} transform={sitting ? "scale(1 0.86)" : undefined}>
          <g className="wd-bob">
            <svg
              x={-width / 2}
              y={-height}
              width={width}
              height={height}
              viewBox={`${sx} ${sy} ${atlas.frameW} ${atlas.frameH}`}
              overflow="hidden"
            >
              <image
                href={atlas.href}
                width={atlas.width}
                height={atlas.height}
                style={{ imageRendering: "pixelated" }}
              />
            </svg>
            {mood === "cheer" && !guest.isCompanion ? (
              <g className="wd-heart" transform={`translate(${width / 2 - 4} ${-height - 4})`}>
                <image href="/assets/tiddybub/ui/heart.svg" width="12" height="12" />
              </g>
            ) : null}
          </g>
        </g>
      </g>
    </g>
  )
}

export function Character({
  role = "guest",
  guest,
  mood = "idle",
  showName = true,
  highlight = false,
  name,
  facing = 1,
  frame = 0,
  animateWave = false,
  size = COUPLE_SIZE,
  jumpFrame = null,
}: {
  role?: FigureRole
  guest?: Guest
  mood?: FigureMood
  showName?: boolean
  highlight?: boolean
  name?: string
  facing?: 1 | -1
  frame?: number
  /** Altar only: occasionally play the 4-frame wave strip. */
  animateWave?: boolean
  /** Drawn width. Jump cells are 256×264, so height follows that aspect. */
  size?: number
  /**
   * Welcome jump strip frame. `null` keeps the idle portrait (or the altar wave).
   * `0` is the stand frame.
   */
  jumpFrame?: number | null
}) {
  const waveFrame = useAltarWave(animateWave && (role === "groom" || role === "bride"), role === "bride" ? 2800 : 0)
  if (role === "groom") {
    return (
      <PixelCouple
        href={COUPLE_IDLE.groom}
        waveHref={COUPLE_WAVE.groom}
        waveFrame={waveFrame}
        jumpHref={COUPLE_JUMP.groom}
        jumpFrame={jumpFrame}
        label={name ?? COUPLE.groomNickname}
        showName={showName}
        size={size}
      />
    )
  }
  if (role === "bride") {
    return (
      <PixelCouple
        href={COUPLE_IDLE.bride}
        waveHref={COUPLE_WAVE.bride}
        waveFrame={waveFrame}
        jumpHref={COUPLE_JUMP.bride}
        jumpFrame={jumpFrame}
        label={name ?? COUPLE.brideNickname}
        showName={showName}
        size={size}
      />
    )
  }
  return (
    <AtlasGuest
      guest={guest as Guest}
      mood={mood}
      showName={showName}
      highlight={highlight}
      facing={facing}
      frame={frame}
    />
  )
}
