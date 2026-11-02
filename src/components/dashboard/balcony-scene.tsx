"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type Ref } from "react"
import { motion } from "framer-motion"
import { CoupleSprite, type CoupleMode } from "@/components/dashboard/couple-sprite"
import { spriteForGuest } from "@/lib/appearance"
import { FOLLOWER_ATLAS, GUEST_GRID } from "@/lib/guest-atlas"
import { COUPLE } from "@/lib/event"
import type { Guest, Wish } from "@/lib/types"

/** Logical stage. Everything inside is laid out in these units and scaled to fit. */
export const STAGE_W = 362
export const STAGE_H = 404
const FLOOR = 200
const CELL = 120
const COUPLE_TOP = FLOOR - Math.round((253 * CELL) / 256)
const CENTER = STAGE_W / 2
const GROOM_LEFT = CENTER - Math.round((186 * CELL) / 256) - 2
const BRIDE_LEFT = CENTER + 2 - Math.round((46 * CELL) / 256)
const RAIL_TOP = FLOOR - 52
const LETTER_Y = RAIL_TOP - 14
const FEET = 400
const GUEST_W = GUEST_GRID.cell
const FOLLOWER_SCALE = 2
const FOLLOWER_W = FOLLOWER_ATLAS.frameW * FOLLOWER_SCALE
const FOLLOWER_H = FOLLOWER_ATLAS.frameH * FOLLOWER_SCALE

/** Railing slots for envelopes, clear of the couple in the middle. Newest takes slot 0. */
const LETTER_SLOTS = [
  { x: 12, r: -8 },
  { x: 312, r: 5 },
  { x: 38, r: 6 },
  { x: 286, r: -6 },
  { x: 64, r: -3 },
  { x: 260, r: 4 },
  { x: 90, r: 7 },
  { x: 336, r: -4 },
]
export const MAX_RAIL_LETTERS = LETTER_SLOTS.length
/** Flight time of a thrown letter; the parent lands it after this. */
export const THROW_MS = 1200

export type Reader = "groom" | "bride"
export type SceneAnim = { kind: "idle" } | { kind: "wave"; key: number } | { kind: "read"; who: Reader; key: number }

type Placed = { guest: Guest; x: number; you: boolean }

function Envelope({ width = 22 }: { width?: number }) {
  return (
    <svg aria-hidden="true" width={width} height={Math.round(width * 0.68)} viewBox="0 0 22 15" className="block">
      <rect x="0.75" y="0.75" width="20.5" height="13.5" rx="1.5" fill="#FFFFFF" stroke="#CDBFAE" strokeWidth="1.5" />
      <path d="M1.5 1.5 L11 8.5 L20.5 1.5" fill="none" stroke="#CDBFAE" strokeWidth="1.5" />
      <circle cx="11" cy="8.6" r="2.4" fill="#E39AA8" />
    </svg>
  )
}

function Backdrop() {
  const boards = []
  for (let x = 9; x < STAGE_W; x += 18) boards.push(<rect key={x} x={x} y={0} width={1} height={FLOOR} fill="#ECE7DE" />)
  const panels = []
  for (let x = 12; x < STAGE_W - 40; x += 86)
    panels.push(<rect key={x} x={x} y={FLOOR + 30} width={74} height={70} fill="none" stroke="#EDE8E0" strokeWidth={2} />)
  const courses = []
  for (let y = FLOOR + 24; y < STAGE_H; y += 12) courses.push(<rect key={y} x={0} y={y} width={STAGE_W} height={1} fill="#F3F0EA" />)
  return (
    <svg aria-hidden="true" width={STAGE_W} height={STAGE_H} viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} className="absolute inset-0">
      <rect width={STAGE_W} height={FLOOR} fill="#F8F6F1" />
      {boards}
      <rect x={78} y={30} width={206} height={122} fill="#FFFFFF" stroke="#E2DBD0" strokeWidth={2} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={86 + i * 49} y={38} width={44} height={106} fill="#E9EDEC" />
          <rect x={86 + i * 49} y={88} width={44} height={2} fill="#FFFFFF" />
        </g>
      ))}
      <rect x={0} y={FLOOR} width={STAGE_W} height={14} fill="#F1EEE8" />
      <rect x={0} y={FLOOR + 12} width={STAGE_W} height={2} fill="#E2DBD0" />
      <rect x={0} y={FLOOR + 14} width={STAGE_W} height={STAGE_H - FLOOR - 14} fill="#FFFFFF" />
      {panels}
      {courses}
      <ellipse cx={18} cy={300} rx={44} ry={70} fill="#C9D6BD" />
      <ellipse cx={40} cy={330} rx={34} ry={44} fill="#B7C8AA" />
      <ellipse cx={346} cy={330} rx={34} ry={46} fill="#C9D6BD" />
    </svg>
  )
}

function Railing() {
  const posts = []
  for (let x = 4; x < STAGE_W; x += 15)
    posts.push(
      <g key={x}>
        <rect x={x} y={6} width={5} height={46} rx={2} fill="#C49A72" />
        <rect x={x + 1} y={6} width={2} height={46} fill="#D6B18C" />
      </g>
    )
  return (
    <svg
      aria-hidden="true"
      width={STAGE_W}
      height={60}
      viewBox={`0 0 ${STAGE_W} 60`}
      className="pointer-events-none absolute left-0"
      style={{ top: RAIL_TOP }}
    >
      {posts}
      <rect x={0} y={0} width={STAGE_W} height={7} rx={2} fill="#A97D57" />
      <rect x={0} y={48} width={STAGE_W} height={5} fill="#A97D57" />
    </svg>
  )
}

function GuestSprite({ guest }: { guest: Guest }) {
  const sprite = spriteForGuest(guest)
  if (guest.isCompanion) {
    return (
      <div
        aria-hidden="true"
        style={{
          width: FOLLOWER_W,
          height: FOLLOWER_H,
          backgroundImage: `url(${FOLLOWER_ATLAS.href})`,
          backgroundSize: `${FOLLOWER_ATLAS.width * FOLLOWER_SCALE}px ${FOLLOWER_H}px`,
          backgroundPosition: `${-sprite.index * FOLLOWER_W}px 0`,
          imageRendering: "pixelated",
        }}
      />
    )
  }
  return (
    <div
      aria-hidden="true"
      style={{
        width: GUEST_W,
        height: GUEST_GRID.height,
        backgroundImage: `url(${GUEST_GRID.href})`,
        backgroundSize: `${GUEST_GRID.width}px ${GUEST_GRID.height}px`,
        backgroundPosition: `${-sprite.index * GUEST_W}px 0`,
        imageRendering: "pixelated",
      }}
    />
  )
}

function widthOf(guest: Guest) {
  return guest.isCompanion ? FOLLOWER_W : GUEST_W
}

/** Your party in the middle, other attending guests split left and right, all inside the stage. */
function placeCrowd(guests: Guest[], selfKey: string, showSelf: boolean): Placed[] {
  const attending = guests.filter((guest) => guest.attendance === "attending")
  const mine = showSelf ? attending.filter((guest) => guest.partyPhone === selfKey) : []
  const me = mine.find((guest) => !guest.isCompanion)
  const myGroup = [...(me ? [me] : []), ...mine.filter((guest) => guest.isCompanion).slice(0, 2)]
  const others = attending.filter((guest) => guest.partyPhone !== selfKey)
  const gap = 2
  const groupGap = 8
  const limit = STAGE_W - 8
  const myWidth = myGroup.reduce((sum, guest) => sum + widthOf(guest), 0) + Math.max(0, myGroup.length - 1) * gap
  const left: Guest[] = []
  const right: Guest[] = []
  let used = myWidth
  for (const guest of others) {
    const w = widthOf(guest) + groupGap
    if (used + w > limit) break
    if (left.length <= right.length) left.unshift(guest)
    else right.push(guest)
    used += w
    if (left.length + right.length >= 6) break
  }
  const row: { guest: Guest; you: boolean; gapAfter: number }[] = [
    ...left.map((guest) => ({ guest, you: false, gapAfter: groupGap })),
    ...myGroup.map((guest, index) => ({ guest, you: guest === me, gapAfter: index === myGroup.length - 1 ? groupGap : gap })),
    ...right.map((guest) => ({ guest, you: false, gapAfter: groupGap })),
  ]
  const total = row.reduce((sum, item, index) => sum + widthOf(item.guest) + (index < row.length - 1 ? item.gapAfter : 0), 0)
  let x = Math.max(4, (STAGE_W - total) / 2)
  return row.map((item) => {
    const placed = { guest: item.guest, x, you: item.you }
    x += widthOf(item.guest) + item.gapAfter
    return placed
  })
}

/** Fit the stage inside the box: never wider than the stage itself, extra height becomes wall. */
function useStageFit(ref: React.RefObject<HTMLDivElement | null>) {
  const [fit, setFit] = useState({ scale: 1, width: STAGE_W })
  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    const update = () => {
      const { width, height } = node.getBoundingClientRect()
      if (width <= 0 || height <= 0) return
      const scale = Math.min(width / STAGE_W, height / STAGE_H)
      setFit({ scale, width: Math.min(width, STAGE_W * scale) })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref])
  return fit
}

export function BalconyScene({
  guests,
  selfKey,
  declined,
  letters,
  anim,
  letter,
  throwing,
  coupleRef,
  onCoupleTap,
  onWaveDone,
  onLetterTap,
  onCloseLetter,
}: {
  guests: Guest[]
  selfKey: string
  declined: boolean
  /** Newest first, already capped to the rail. */
  letters: Wish[]
  anim: SceneAnim
  /** The letter being read, shown on the card over the guests. */
  letter: Wish | null
  throwing: number | null
  coupleRef?: Ref<HTMLButtonElement>
  onCoupleTap: () => void
  onWaveDone: () => void
  onLetterTap: (wish: Wish) => void
  onCloseLetter: () => void
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const { scale, width: frameWidth } = useStageFit(boxRef)
  const crowd = useMemo(() => placeCrowd(guests, selfKey, !declined), [guests, selfKey, declined])
  const you = crowd.find((item) => item.you)
  const throwFrom = you ? { x: you.x + 20, y: FEET - 60 } : { x: STAGE_W - 30, y: FEET - 70 }
  const throwTo = { x: LETTER_SLOTS[0].x, y: LETTER_Y }

  const groomMode: CoupleMode = anim.kind === "wave" ? "wave" : anim.kind === "read" && anim.who === "groom" ? "read" : "idle"
  const brideMode: CoupleMode = anim.kind === "wave" ? "wave" : anim.kind === "read" && anim.who === "bride" ? "read" : "idle"
  const playKey = anim.kind === "idle" ? 0 : anim.key
  const reader = anim.kind === "read" ? (anim.who === "groom" ? COUPLE.groomNickname : COUPLE.brideNickname) : null

  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (letter) closeRef.current?.focus({ preventScroll: true })
  }, [letter])

  return (
    <div ref={boxRef} className="flex h-full w-full justify-center">
    <div
      className="relative h-full overflow-hidden rounded-2xl border border-[#E6DED0] bg-[#F8F6F1]"
      style={{
        width: frameWidth,
        backgroundImage: `repeating-linear-gradient(90deg, transparent 0 ${9 * scale}px, #ECE7DE ${9 * scale}px ${10 * scale}px, transparent ${10 * scale}px ${18 * scale}px)`,
      }}
    >
      <div
        className="absolute bottom-0 left-1/2 origin-bottom"
        style={{ width: STAGE_W, height: STAGE_H, transform: `translateX(-50%) scale(${scale})` }}
      >
        <Backdrop />

        <button
          ref={coupleRef}
          type="button"
          onClick={onCoupleTap}
          aria-label={`แตะ${COUPLE.groomNickname}กับ${COUPLE.brideNickname}เพื่อทักทาย`}
          className="absolute flex cursor-pointer items-end rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2B2621]"
          style={{ left: GROOM_LEFT, top: COUPLE_TOP, width: BRIDE_LEFT + CELL - GROOM_LEFT, height: CELL }}
        >
          <span className="absolute" style={{ left: 0, top: 0 }}>
            <CoupleSprite key={`g-${groomMode}-${playKey}`} role="groom" mode={groomMode} playKey={playKey} size={CELL} onWaveDone={onWaveDone} />
          </span>
          <span className="absolute" style={{ left: BRIDE_LEFT - GROOM_LEFT, top: 0 }}>
            <CoupleSprite key={`b-${brideMode}-${playKey}`} role="bride" mode={brideMode} playKey={playKey} size={CELL} />
          </span>
        </button>

        <Railing />

        {letters.map((wish, index) => {
          const slot = LETTER_SLOTS[index]
          if (!slot) return null
          return (
            <button
              key={wish.id}
              type="button"
              onClick={() => onLetterTap(wish)}
              aria-label={`อ่านจดหมายจาก ${wish.from}`}
              className="absolute -m-1.5 cursor-pointer p-1.5"
              style={{ left: slot.x, top: LETTER_Y, transform: `rotate(${slot.r}deg)` }}
            >
              <Envelope />
            </button>
          )
        })}

        {anim.kind === "wave" ? (
          <div
            className="absolute -translate-x-1/2 rounded-lg border-2 border-[#2B2621] bg-white px-3 py-1 text-[13px] font-medium whitespace-nowrap text-[#2B2621]"
            style={{ left: CENTER, top: COUPLE_TOP - 30 }}
          >
            ขอบคุณที่มานะ!
          </div>
        ) : null}

        {crowd.map((item) => (
          <div key={item.guest.id} className="absolute" style={{ left: item.x, top: FEET - (item.guest.isCompanion ? FOLLOWER_H : GUEST_GRID.height) }}>
            {!item.guest.isCompanion ? (
              <div aria-hidden="true" className="absolute rounded-[50%] bg-[#E6DED0]" style={{ left: 4, top: GUEST_GRID.height - 6, width: 50, height: 10 }} />
            ) : null}
            <div className="relative">
              <GuestSprite guest={item.guest} />
            </div>
            {item.you ? (
              <span className="absolute left-1/2 -translate-x-1/2 rounded bg-[#2B2621] px-1.5 py-px text-[10px] font-semibold tracking-wider text-white" style={{ top: -18 }}>
                YOU
              </span>
            ) : null}
          </div>
        ))}

        {declined ? (
          <span className="absolute right-2.5 rounded-full border border-[#E6DED0] bg-white px-2.5 py-0.5 text-[11px] text-[#2B2621]" style={{ top: FLOOR + 22 }}>
            คุณส่งกำลังใจจากที่ไกล ๆ
          </span>
        ) : null}

        {throwing !== null ? (
          <motion.div
            key={throwing}
            className="pointer-events-none absolute z-10"
            style={{ left: throwFrom.x, top: throwFrom.y }}
            initial={{ x: 0, y: 0, rotate: 0, scale: 1 }}
            animate={{
              x: [0, (throwTo.x - throwFrom.x) / 2, throwTo.x - throwFrom.x],
              y: [0, throwTo.y - throwFrom.y - 70, throwTo.y - throwFrom.y],
              rotate: [0, 220, 356],
              scale: [1, 1.12, 1],
            }}
            transition={{ duration: THROW_MS / 1000, ease: [0.3, 0.6, 0.4, 1], times: [0, 0.55, 1] }}
          >
            <Envelope width={24} />
          </motion.div>
        ) : null}
      </div>

      {letter && reader ? (
        <div
          role="dialog"
          aria-label={`จดหมายจาก ${letter.from}`}
          className="absolute inset-x-3 bottom-3 z-20 mx-auto flex max-h-[62%] max-w-md flex-col gap-1.5 overflow-y-auto rounded-lg border border-[#E6DED0] bg-white px-4 pt-3 pb-3.5 shadow-[0_8px_20px_rgba(46,42,39,0.12)]"
        >
          <div className="flex items-center gap-2">
            <Envelope width={18} />
            <span className="flex-1 text-xs text-[#6F665C]">{reader}กำลังอ่าน</span>
            <button
              ref={closeRef}
              type="button"
              onClick={onCloseLetter}
              aria-label="ปิดจดหมาย"
              className="-my-2 -mr-2 flex size-11 items-center justify-center rounded-md text-[#2B2621] hover:bg-[#FAF7F1]"
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <p className="text-sm font-semibold text-[#2B2621]">จาก {letter.from}</p>
          <p className="text-sm leading-relaxed break-words whitespace-pre-line text-[#2B2621]">{letter.text}</p>
        </div>
      ) : null}
    </div>
    </div>
  )
}
