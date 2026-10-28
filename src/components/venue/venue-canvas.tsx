"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion, useAnimationFrame, useReducedMotion } from "framer-motion"
import { SceneBackdrop, SceneForeground } from "@/components/venue/backdrop"
import { Character } from "@/components/venue/character"
import { ChatBubble, bubbleOffsetY, useWishSlots, type WishSlot } from "@/components/venue/wish-field"
import { COUPLE } from "@/lib/event"
import { footY, placeGuests, SCENE, type PlacedGuest } from "@/lib/scene-layout"
import { poseOnPath, type WalkPose } from "@/lib/walk"
import type { Guest, Wish } from "@/lib/types"

function CoupleActor({
  role,
  reduced,
}: {
  role: "groom" | "bride"
  reduced: boolean
}) {
  const router = useRouter()
  const base = role === "groom" ? SCENE.groom : SCENE.bride
  return (
    <motion.g
      initial={{ opacity: 0, x: base.x, y: base.y + 10, scale: 1.15 }}
      animate={{ opacity: 1, x: base.x, y: base.y, scale: 1.15 }}
      whileHover={reduced ? undefined : { scale: 1.42 }}
      whileTap={reduced ? undefined : { scale: 1.52 }}
      transition={{ type: "spring", stiffness: 280, damping: 18 }}
      style={{ cursor: "pointer" }}
      onClick={() => router.push("/story")}
    >
      <title>{`อ่านประวัติ${role === "bride" ? COUPLE.brideNickname : COUPLE.groomNickname}`}</title>
      <rect x={-32} y={-82} width={64} height={90} fill="transparent" />
      <Character role={role} mood="idle" showName name={role === "bride" ? COUPLE.brideNickname : COUPLE.groomNickname} />
    </motion.g>
  )
}

function GuestBubble({ slot }: { slot?: WishSlot }) {
  return (
    <AnimatePresence>
      {slot ? <ChatBubble key={slot.key} from={slot.wish.from} text={slot.wish.text} /> : null}
    </AnimatePresence>
  )
}

function WalkingGuest({
  placed,
  showName,
  mine,
  reduced,
  slot,
}: {
  placed: PlacedGuest
  showName: boolean
  mine: boolean
  reduced: boolean
  slot?: WishSlot
}) {
  const start = placed.path[0]
  const [pose, setPose] = useState<WalkPose>({
    x: start.x,
    y: start.y,
    facing: placed.facing,
    walking: true,
    hop: 0,
  })

  useAnimationFrame((time) => {
    if (reduced) return
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

  return (
    <g transform={`translate(${pose.x} ${pose.y - pose.hop})`}>
      <g transform={`scale(${placed.scale})`}>
        <Character
          guest={placed.guest}
          mood={pose.walking && !reduced ? "walk" : "idle"}
          showName={showName}
          highlight={mine}
          facing={pose.facing}
          frame={pose.hop > 1.6 ? 1 : 0}
        />
      </g>
      <g transform={`translate(0 ${bubbleOffsetY(placed)})`}>
        <GuestBubble slot={slot} />
      </g>
    </g>
  )
}

function StillGuest({
  placed,
  showName,
  mine,
  slot,
}: {
  placed: PlacedGuest
  showName: boolean
  mine: boolean
  slot?: WishSlot
}) {
  const start = placed.path[0]
  return (
    <g transform={`translate(${start.x} ${start.y})`}>
      <g transform={`scale(${placed.scale})`}>
        <Character
          guest={placed.guest}
          mood={placed.mood}
          showName={showName}
          highlight={mine}
          facing={placed.facing}
        />
      </g>
      <g transform={`translate(0 ${bubbleOffsetY(placed)})`}>
        <GuestBubble slot={slot} />
      </g>
    </g>
  )
}

function GuestActor({
  placed,
  showName,
  mine,
  reduced,
  slot,
}: {
  placed: PlacedGuest
  showName: boolean
  mine: boolean
  reduced: boolean
  slot?: WishSlot
}) {
  if (placed.mood === "walk") {
    return <WalkingGuest placed={placed} showName={showName} mine={mine} reduced={reduced} slot={slot} />
  }
  return <StillGuest placed={placed} showName={showName} mine={mine} slot={slot} />
}

function DustMotes({ reduced }: { reduced: boolean }) {
  if (reduced) return null
  const motes = [
    { left: "28%", delay: 0, dur: 9, src: "/assets/tiddybub/particles/spark.png" },
    { left: "36%", delay: 1.4, dur: 11, src: "/assets/tiddybub/particles/star.png" },
    { left: "48%", delay: 0.6, dur: 8, src: "/assets/tiddybub/particles/light.png" },
    { left: "58%", delay: 2.2, dur: 12, src: "/assets/tiddybub/particles/spark.png" },
    { left: "64%", delay: 0.9, dur: 10, src: "/assets/tiddybub/particles/window.png" },
    { left: "42%", delay: 3, dur: 13, src: "/assets/tiddybub/particles/star.png" },
  ]
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {motes.map((mote, index) => (
        <motion.img
          key={index}
          src={mote.src}
          alt=""
          className="absolute block"
          style={{
            left: mote.left,
            width: 10,
            height: 10,
            top: "18%",
            imageRendering: "pixelated",
            mixBlendMode: "screen",
          }}
          animate={{ y: [0, 220], opacity: [0, 0.85, 0], x: [0, index % 2 === 0 ? 18 : -14] }}
          transition={{ duration: mote.dur, delay: mote.delay, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  )
}

export function VenueCanvas({
  guests,
  phone,
  wishes = [],
  showWishes = true,
}: {
  guests: Guest[]
  phone: string | null
  wishes?: Wish[]
  showWishes?: boolean
}) {
  const reduced = useReducedMotion() === true
  const placed = useMemo(() => placeGuests(guests, phone), [guests, phone])
  const ordered = useMemo(() => [...placed].sort((a, b) => footY(a) - footY(b)), [placed])
  const slots = useWishSlots(wishes, placed, showWishes)
  const slotByGuest = useMemo(() => {
    const map = new Map<string, WishSlot>()
    for (const slot of slots) map.set(slot.guestId, slot)
    return map
  }, [slots])

  return (
    <div className="hd2d-stage absolute inset-0 overflow-hidden bg-[#121018]">
      <div className="hd2d-world">
        <svg
          viewBox={`0 0 ${SCENE.width} ${SCENE.height}`}
          className="h-full w-full font-sans"
          preserveAspectRatio="xMidYMid slice"
        >
          <SceneBackdrop />
          <CoupleActor role="groom" reduced={reduced} />
          <CoupleActor role="bride" reduced={reduced} />
          {ordered.map((guest) => {
            const registrant =
              Boolean(phone) && guest.guest.partyPhone === phone && !guest.guest.isCompanion
            return (
              <GuestActor
                key={guest.guest.id}
                placed={guest}
                showName={registrant}
                mine={registrant}
                reduced={reduced}
                slot={slotByGuest.get(guest.guest.id)}
              />
            )
          })}
          <SceneForeground />
        </svg>
      </div>
      <div className="hd2d-dof hd2d-dof-top" />
      <div className="hd2d-dof hd2d-dof-bot" />
      <div className="hd2d-vignette" />
      <div className="hd2d-grain" />
      <DustMotes reduced={reduced} />
    </div>
  )
}
