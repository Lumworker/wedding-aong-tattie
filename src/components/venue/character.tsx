"use client"

import { useEffect, useState } from "react"
import { useReducedMotion } from "framer-motion"
import { spriteForGuest } from "@/lib/appearance"
import { COUPLE } from "@/lib/event"
import type { Guest } from "@/lib/types"

/** Square chibi frame, sized to sit on the altar without covering the aisle. */
const COUPLE_SIZE = 56

/** Wave strips: 4 frames of 256, 4px transparent gutter, outer pad included (1044×264). */
const WAVE = {
  frames: 4,
  frame: 256,
  gutter: 4,
  width: 1044,
  height: 264,
  frameMs: 170,
  cycles: 2,
  pauseMs: 8400,
} as const

function waveOrigin(index: number) {
  return WAVE.gutter + index * (WAVE.frame + WAVE.gutter)
}

/** Idle most of the time, then a short two-cycle wave. `delayMs` staggers the pair. */
function useAltarWave(active: boolean, delayMs: number) {
  const reduced = useReducedMotion() === true
  const [frame, setFrame] = useState<number | null>(null)

  useEffect(() => {
    if (!active || reduced) {
      setFrame(null)
      return
    }

    let wait = 0
    let tick = 0
    let stopped = false

    const play = () => {
      if (stopped) return
      let step = 0
      const total = WAVE.frames * WAVE.cycles
      setFrame(0)
      tick = window.setInterval(() => {
        step += 1
        if (step >= total) {
          window.clearInterval(tick)
          setFrame(null)
          wait = window.setTimeout(play, WAVE.pauseMs)
          return
        }
        setFrame(step % WAVE.frames)
      }, WAVE.frameMs)
    }

    wait = window.setTimeout(play, 2400 + delayMs)
    return () => {
      stopped = true
      window.clearTimeout(wait)
      window.clearInterval(tick)
    }
  }, [active, delayMs, reduced])

  return frame
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
  label,
  showName,
  size,
}: {
  href: string
  waveHref?: string
  waveFrame: number | null
  label: string
  showName: boolean
  size: number
}) {
  const waving = waveFrame !== null && waveHref
  return (
    <g>
      {label ? <title>{label}</title> : null}
      <ellipse cx="2" cy="4" rx={size * 0.22} ry="3.2" fill="#05040A" opacity="0.5" />
      <g className="is-idle">
        <g className="wd-bob">
          {waving ? (
            <svg
              x={-size / 2}
              y={-size}
              width={size}
              height={size}
              viewBox={`${waveOrigin(waveFrame)} ${WAVE.gutter} ${WAVE.frame} ${WAVE.frame}`}
              overflow="hidden"
            >
              <image
                href={waveHref}
                width={WAVE.width}
                height={WAVE.height}
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
      {showName && label ? <Nameplate label={label} y={-size - 8} highlight hero /> : null}
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
}) {
  const waveFrame = useAltarWave(animateWave && (role === "groom" || role === "bride"), role === "bride" ? 2800 : 0)
  if (role === "groom") {
    return (
      <PixelCouple
        href="/sprites/groom.png?v=5"
        waveHref="/sprites/groom-wave.png?v=1"
        waveFrame={waveFrame}
        label={name ?? COUPLE.groomNickname}
        showName={showName}
        size={COUPLE_SIZE}
      />
    )
  }
  if (role === "bride") {
    return (
      <PixelCouple
        href="/sprites/bride.png?v=5"
        waveHref="/sprites/bride-wave.png?v=1"
        waveFrame={waveFrame}
        label={name ?? COUPLE.brideNickname}
        showName={showName}
        size={COUPLE_SIZE}
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
