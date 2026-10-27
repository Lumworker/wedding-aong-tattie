"use client"

import { useMemo, useRef, useState, type ReactNode } from "react"
import { motion, useAnimationFrame, useReducedMotion } from "framer-motion"
import { SceneBackdrop, SceneForeground } from "@/components/venue/backdrop"
import { Character } from "@/components/venue/character"
import { COUPLE } from "@/lib/event"
import { footY, placeGuests, SCENE, type PlacedGuest } from "@/lib/scene-layout"
import { poseOnPath, type WalkPose } from "@/lib/walk"
import type { Guest } from "@/lib/types"

function CoupleActor({
  role,
  reduced,
}: {
  role: "groom" | "bride"
  reduced: boolean
}) {
  const base = role === "groom" ? SCENE.groom : SCENE.bride
  return (
    <motion.g
      initial={{ opacity: 0, x: base.x, y: base.y + 10 }}
      animate={{ opacity: 1, x: base.x, y: base.y }}
      transition={{ duration: reduced ? 0.3 : 0.7, delay: reduced ? 0 : 0.12 }}
    >
      <g transform="scale(1.15)">
        <Character role={role} mood="idle" showName name={role === "bride" ? COUPLE.brideNickname : COUPLE.groomNickname} />
      </g>
    </motion.g>
  )
}

function GuestActor({
  placed,
  showName,
  mine,
  reduced,
}: {
  placed: PlacedGuest
  showName: boolean
  mine: boolean
  reduced: boolean
}) {
  const start = placed.path[0]
  const [pose, setPose] = useState<WalkPose>({
    x: start.x,
    y: start.y,
    facing: placed.facing,
    walking: placed.mood === "walk",
    hop: 0,
  })

  useAnimationFrame((time) => {
    if (reduced || placed.mood !== "walk") return
    const seconds = time / 1000 - placed.delay
    if (seconds < 0) return
    const next = poseOnPath(placed.path, placed.speed, seconds)
    setPose((current) =>
      current.x === next.x &&
      current.y === next.y &&
      current.facing === next.facing &&
      current.walking === next.walking &&
      Math.abs(current.hop - next.hop) < 0.15
        ? current
        : next
    )
  })

  const mood = placed.mood === "walk" ? (pose.walking ? "walk" : "idle") : placed.mood
  const facing = placed.mood === "walk" ? pose.facing : placed.facing

  return (
    <g transform={`translate(${pose.x} ${pose.y - pose.hop})`}>
      <g transform={`scale(${placed.scale})`}>
        <Character
          guest={placed.guest}
          mood={mood}
          showName={showName}
          highlight={mine}
          facing={facing}
        />
      </g>
    </g>
  )
}

function DustMotes({ reduced }: { reduced: boolean }) {
  if (reduced) return null
  const motes = [
    { left: "28%", delay: 0, dur: 9 },
    { left: "36%", delay: 1.4, dur: 11 },
    { left: "48%", delay: 0.6, dur: 8 },
    { left: "58%", delay: 2.2, dur: 12 },
    { left: "64%", delay: 0.9, dur: 10 },
    { left: "42%", delay: 3, dur: 13 },
  ]
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {motes.map((mote, index) => (
        <motion.span
          key={index}
          className="absolute block rounded-full bg-[#fff6d0]"
          style={{ left: mote.left, width: 3, height: 3, top: "18%" }}
          animate={{ y: [0, 220], opacity: [0, 0.8, 0], x: [0, index % 2 === 0 ? 18 : -14] }}
          transition={{ duration: mote.dur, delay: mote.delay, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  )
}

export function VenueCanvas({
  guests,
  phone,
  showNames,
  children,
}: {
  guests: Guest[]
  phone: string | null
  showNames: boolean
  children?: ReactNode
}) {
  const reduced = useReducedMotion() === true
  const svgRef = useRef<SVGSVGElement>(null)
  const placed = useMemo(() => placeGuests(guests, phone), [guests, phone])
  const ordered = useMemo(() => [...placed].sort((a, b) => footY(a) - footY(b)), [placed])

  return (
    <div className="hd2d-stage absolute inset-0 overflow-hidden bg-[#121018]">
      <div className="hd2d-world">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SCENE.width} ${SCENE.height}`}
          className="h-full w-full font-sans"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <SceneBackdrop />
          <CoupleActor role="groom" reduced={reduced} />
          <CoupleActor role="bride" reduced={reduced} />
          {ordered.map((guest) => (
            <GuestActor
              key={guest.guest.id}
              placed={guest}
              showName={showNames}
              mine={Boolean(phone) && guest.guest.partyPhone === phone}
              reduced={reduced}
            />
          ))}
          <SceneForeground />
        </svg>
      </div>
      <div className="hd2d-dof hd2d-dof-top" />
      <div className="hd2d-dof hd2d-dof-bot" />
      <div className="hd2d-vignette" />
      <div className="hd2d-grain" />
      <DustMotes reduced={reduced} />
      {children}
    </div>
  )
}

export { SCENE }
