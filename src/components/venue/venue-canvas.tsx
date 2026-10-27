"use client"

import { useMemo, useRef, useState, type ReactNode } from "react"
import { motion, useAnimationFrame, useReducedMotion } from "framer-motion"
import { PetalField } from "@/components/petal-field"
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
    facing: 1,
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

  const mood = placed.mood === "cheer" ? "cheer" : pose.walking ? "walk" : "idle"

  return (
    <g transform={`translate(${pose.x} ${pose.y - pose.hop})`} opacity={1}>
      <g transform={`scale(${placed.scale})`}>
        <Character
          guest={placed.guest}
          mood={mood}
          showName={showName}
          highlight={mine}
          facing={pose.facing}
        />
      </g>
    </g>
  )
}

function Hearts({ reduced }: { reduced: boolean }) {
  const x = (SCENE.groom.x + SCENE.bride.x) / 2
  if (reduced) {
    return (
      <text x={x} y="390" textAnchor="middle" fill="#C48984" fontSize="16" opacity="0.85">
        ♥
      </text>
    )
  }
  return (
    <g>
      {[0, 1].map((index) => (
        <motion.text
          key={index}
          x={x + (index === 0 ? -8 : 10)}
          textAnchor="middle"
          fill="#C48984"
          fontSize={index === 0 ? 16 : 11}
          initial={{ opacity: 0, y: 430 }}
          animate={{ y: [438, 388], opacity: [0, 1, 0] }}
          transition={{
            duration: 3.8,
            repeat: Infinity,
            ease: "easeOut",
            delay: 0.6 + index * 1.4,
            times: [0, 0.35, 1],
          }}
        >
          ♥
        </motion.text>
      ))}
    </g>
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
    <div className="absolute inset-0">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SCENE.width} ${SCENE.height}`}
        className="h-full w-full font-sans"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <SceneBackdrop />
        <Hearts reduced={reduced} />
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
      <PetalField />
      {children}
    </div>
  )
}

export { SCENE }
