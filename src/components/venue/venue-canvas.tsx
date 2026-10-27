"use client"

import { useMemo, useRef, type ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { PetalField } from "@/components/petal-field"
import { SceneBackdrop, SceneForeground } from "@/components/venue/backdrop"
import { Character } from "@/components/venue/character"
import { COUPLE } from "@/lib/event"
import { footY, placeGuests, SCENE, type PlacedGuest } from "@/lib/scene-layout"
import type { Guest } from "@/lib/types"

function CoupleActor({
  role,
  reduced,
}: {
  role: "groom" | "bride"
  reduced: boolean
}) {
  const base = role === "groom" ? SCENE.groom : SCENE.bride
  const sway = role === "groom" ? [base.x - 4, base.x + 3, base.x - 4] : [base.x + 4, base.x - 3, base.x + 4]
  return (
    <motion.g
      initial={{ opacity: 0, x: base.x, y: base.y + 12 }}
      animate={reduced ? { opacity: 1, x: base.x, y: base.y } : { opacity: 1, x: sway, y: base.y }}
      transition={
        reduced
          ? { duration: 0.4 }
          : {
              opacity: { duration: 0.8, delay: 0.15 },
              x: { duration: role === "groom" ? 5.2 : 5.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 },
              y: { duration: 0.8, delay: 0.15 },
            }
      }
    >
      <g transform="scale(1.14)">
        <Character role={role} mood="idle" showName name={role === "bride" ? COUPLE.brideNickname : COUPLE.groomShort} />
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
  const fromX = Array.isArray(placed.x) ? placed.x[0] : placed.x
  const fromY = Array.isArray(placed.y) ? placed.y[0] : placed.y
  return (
    <motion.g
      initial={{ opacity: 0, x: fromX, y: fromY + (reduced ? 0 : 10) }}
      animate={reduced ? { opacity: 1, x: fromX, y: fromY } : { opacity: 1, x: placed.x, y: placed.y }}
      transition={
        reduced
          ? { duration: 0.35, delay: Math.min(placed.delay, 0.2) }
          : {
              opacity: { duration: 0.55, delay: placed.delay },
              x: { duration: placed.duration, delay: placed.delay, repeat: Infinity, ease: "easeInOut" },
              y: { duration: placed.duration, delay: placed.delay, repeat: Infinity, ease: "easeInOut" },
            }
      }
    >
      <g transform={`scale(${placed.scale})`}>
        <Character
          guest={placed.guest}
          mood={placed.mood === "walk" ? "walk" : "cheer"}
          showName={showName}
          highlight={mine}
        />
      </g>
    </motion.g>
  )
}

function Hearts({ reduced }: { reduced: boolean }) {
  const x = (SCENE.groom.x + SCENE.bride.x) / 2
  if (reduced) {
    return (
      <text x={x} y="470" textAnchor="middle" fill="#C48984" fontSize="16" opacity="0.85">
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
          initial={{ opacity: 0, y: 500 }}
          animate={{ y: [508, 458], opacity: [0, 1, 0] }}
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
        preserveAspectRatio="xMidYMid meet"
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
