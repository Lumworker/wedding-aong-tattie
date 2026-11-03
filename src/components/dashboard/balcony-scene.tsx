"use client"

import { useLayoutEffect, useMemo, useRef, useState, type Ref } from "react"
import { motion } from "framer-motion"
import { CoupleSprite, type CoupleMode } from "@/components/dashboard/couple-sprite"
import { spriteForGuest } from "@/lib/appearance"
import { FOLLOWER_ATLAS, GUEST_GRID } from "@/lib/guest-atlas"
import { COUPLE } from "@/lib/event"
import type { Guest, Wish } from "@/lib/types"

/**
 * Garden hero (CI Nov 2026). The couple is the hero in the middle on a rose halo,
 * only your own party stands with them, and letters live in the scene:
 * a pile at the bottom right, a count chip, and a note at the top edge while one of them reads.
 * Everything is laid out in stage units and scaled to fit the box.
 */
export const STAGE_W = 362
export const STAGE_H = 320
const CENTER = STAGE_W / 2
/** Top of the gingham floor band, in stage units. */
const FLOOR = 228
const CELL = 160
const COUPLE_FEET = 270
const COUPLE_TOP = COUPLE_FEET - Math.round((253 * CELL) / 256)
/** Letter note sits at the top edge so it never covers a face. */
const NOTE_TOP = 8
/** Letter pile, bottom right; envelopes land below the bride's hem. */
const PILE_TOP = 238
const GROOM_LEFT = CENTER - Math.round((186 * CELL) / 256) - 2
const BRIDE_LEFT = CENTER + 2 - Math.round((46 * CELL) / 256)
/** Party stands in front, clear of the status card that overlaps the bottom ~20px. */
const PARTY_FEET = 292
/** Your guest sprite is drawn about 60% of the couple; followers about 60% of that. */
const GUEST_H = 88
const GUEST_SCALE = GUEST_H / GUEST_GRID.height
const GUEST_W = GUEST_GRID.cell * GUEST_SCALE
const FOLLOWER_H = 52
const FOLLOWER_SCALE = FOLLOWER_H / FOLLOWER_ATLAS.frameH
const FOLLOWER_W = FOLLOWER_ATLAS.frameW * FOLLOWER_SCALE

/** Flight time of a thrown letter; the parent starts the read after this. */
export const THROW_MS = 1000

export type Reader = "groom" | "bride"
export type SceneAnim = { kind: "idle" } | { kind: "wave"; key: number } | { kind: "read"; who: Reader; key: number }

export function Envelope({ width = 22 }: { width?: number }) {
  return (
    <svg aria-hidden="true" width={width} height={Math.round(width * 0.68)} viewBox="0 0 22 15" className="block">
      <rect x="0.75" y="0.75" width="20.5" height="13.5" rx="1.5" fill="#FFFCF5" stroke="#CDBFAE" strokeWidth="1.5" />
      <path d="M1.5 1.5 L11 8.5 L20.5 1.5" fill="none" stroke="#CDBFAE" strokeWidth="1.5" />
      <circle cx="11" cy="8.6" r="2.4" fill="#E0AFA6" />
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
        height: GUEST_H,
        backgroundImage: `url(${GUEST_GRID.href})`,
        backgroundSize: `${GUEST_GRID.width * GUEST_SCALE}px ${GUEST_H}px`,
        backgroundPosition: `${-sprite.index * GUEST_W}px 0`,
        imageRendering: "pixelated",
      }}
    />
  )
}

/**
 * Only your own party: you at the left edge, then up to two followers tucked in
 * just behind your right shoulder so the group stays clear of the groom.
 * Followers come first in the list so they paint behind you.
 */
function placeParty(guests: Guest[], selfKey: string, left: number) {
  const mine = guests.filter((guest) => guest.partyPhone === selfKey && guest.attendance === "attending")
  const me = mine.find((guest) => !guest.isCompanion)
  const followers = mine.filter((guest) => guest.isCompanion).slice(0, 2)
  const firstFollower = me ? left + GUEST_W - 14 : left
  const placed = followers.map((guest, index) => ({ guest, x: firstFollower + index * (FOLLOWER_W - 8), you: false, back: Boolean(me) }))
  return me ? [...placed, { guest: me, x: left, you: true, back: false }] : placed
}

function useStageScale(ref: React.RefObject<HTMLDivElement | null>) {
  const [fit, setFit] = useState({ scale: 1, cropX: 0 })
  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    const update = () => {
      const { width, height } = node.getBoundingClientRect()
      if (width <= 0 || height <= 0) return
      // Fill the height first; up to 18% of the stage width may be cropped at the sides.
      const scale = Math.min(height / STAGE_H, width / (STAGE_W * 0.82))
      setFit({ scale, cropX: Math.max(0, (STAGE_W * scale - width) / (2 * scale)) })
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
  letterCount,
  anim,
  letter,
  throwing,
  coupleRef,
  lettersRef,
  onCoupleTap,
  onWaveDone,
  onOpenLetters,
  onOpenLetter,
}: {
  guests: Guest[]
  selfKey: string
  declined: boolean
  letterCount: number
  anim: SceneAnim
  /** The letter being read; shown in a note above the reader. */
  letter: Wish | null
  throwing: number | null
  coupleRef?: Ref<HTMLButtonElement>
  lettersRef?: Ref<HTMLButtonElement>
  onCoupleTap: () => void
  onWaveDone: () => void
  onOpenLetters: () => void
  onOpenLetter: (wish: Wish) => void
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const { scale, cropX } = useStageScale(boxRef)
  const floorBand = (STAGE_H - FLOOR) * scale
  const party = useMemo(() => (declined ? [] : placeParty(guests, selfKey, cropX + 12)), [guests, selfKey, declined, cropX])
  const you = party.find((item) => item.you)
  const throwFrom = you ? { x: you.x + 16, y: PARTY_FEET - 50 } : { x: CENTER - 12, y: STAGE_H - 10 }
  const throwTo = { x: CENTER - 12, y: COUPLE_TOP + 70 }

  const groomMode: CoupleMode = anim.kind === "wave" ? "wave" : anim.kind === "read" && anim.who === "groom" ? "read" : "idle"
  const brideMode: CoupleMode = anim.kind === "wave" ? "wave" : anim.kind === "read" && anim.who === "bride" ? "read" : "idle"
  const playKey = anim.kind === "idle" ? 0 : anim.key
  const reader = anim.kind === "read" ? anim.who : null
  // The note takes the top strip, so the count chip steps aside while a letter is up.
  const reading = Boolean(letter && reader)

  return (
    <div ref={boxRef} className="relative h-full w-full overflow-hidden rounded-[20px] border border-[#E6DCC4] bg-[#FFF8E6]">
      {/* Floor band runs the full width so wide boxes never show a seam. */}
      <div
        aria-hidden="true"
        className="gingham absolute inset-x-0 bottom-0 border-t border-[#E6DCC4]"
        style={{ height: floorBand }}
      />
      <div
        className="absolute bottom-0 left-1/2 origin-bottom"
        style={{ width: STAGE_W, height: STAGE_H, transform: `translateX(-50%) scale(${scale})` }}
      >
        <svg aria-hidden="true" width={STAGE_W} height={STAGE_H} viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} className="absolute inset-0 overflow-visible">
          <circle cx={CENTER} cy={156} r={116} fill="#F2D9D3" />
          <ellipse cx={cropX - 4} cy={204} rx={44} ry={56} fill="#7A9070" />
          <ellipse cx={STAGE_W - cropX + 6} cy={210} rx={42} ry={48} fill="#8EA383" />
        </svg>

        <button
          ref={coupleRef}
          type="button"
          onClick={onCoupleTap}
          aria-label={`แตะ${COUPLE.groomNickname}กับ${COUPLE.brideNickname}เพื่อทักทาย`}
          className="absolute cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E4535]"
          style={{ left: GROOM_LEFT, top: COUPLE_TOP, width: BRIDE_LEFT + CELL - GROOM_LEFT, height: CELL }}
        >
          <span className="absolute" style={{ left: 0, top: 0 }}>
            <CoupleSprite key={`g-${groomMode}-${playKey}`} role="groom" mode={groomMode} playKey={playKey} size={CELL} onWaveDone={onWaveDone} />
          </span>
          <span className="absolute" style={{ left: BRIDE_LEFT - GROOM_LEFT, top: 0 }}>
            <CoupleSprite key={`b-${brideMode}-${playKey}`} role="bride" mode={brideMode} playKey={playKey} size={CELL} />
          </span>
        </button>

        {letterCount > 0 ? (
          <button
            type="button"
            onClick={onOpenLetters}
            aria-label={`ดูจดหมายทั้งหมด ${letterCount} ฉบับ`}
            className="absolute flex h-14 w-[110px] cursor-pointer items-end justify-center gap-1 pb-0.5"
            style={{ left: STAGE_W - cropX - 14 - 110, top: PILE_TOP }}
          >
            {[-8, 5, -3].slice(0, Math.min(3, letterCount)).map((r, i) => (
              <span key={i} style={{ transform: `rotate(${r}deg) translateY(${i === 1 ? -3 : 0}px)` }}>
                <Envelope width={30} />
              </span>
            ))}
          </button>
        ) : null}

        {party.map((item) => (
          <div
            key={item.guest.id}
            className="absolute"
            style={{ left: item.x, top: PARTY_FEET - (item.back ? 6 : 0) - (item.guest.isCompanion ? FOLLOWER_H : GUEST_H) }}
          >
            <GuestSprite guest={item.guest} />
            {item.you ? (
              <span className="absolute left-1/2 -translate-x-1/2 rounded bg-[#2E4535] px-1.5 py-px text-[10px] font-medium text-[#F6F1E8]" style={{ top: -18 }}>
                คุณ
              </span>
            ) : null}
          </div>
        ))}

        {declined ? (
          <span
            className="absolute rounded-full border border-[#E6DCC4] bg-[#FFFCF5] px-2.5 py-0.5 text-[11px] whitespace-nowrap text-[#2E4535]"
            style={{ left: cropX + 10, top: PARTY_FEET - 26 }}
          >
            ส่งกำลังใจจากไกล ๆ
          </span>
        ) : null}

        {anim.kind === "wave" ? (
          <div
            className="absolute -translate-x-1/2 rounded-full border border-[#2E4535] bg-[#FFFCF5] px-3 py-1 text-[13px] whitespace-nowrap text-[#2E4535]"
            style={{ left: CENTER, top: 12 }}
          >
            ขอบคุณที่มานะ!
          </div>
        ) : null}

        {letter && reader ? (
          <button
            type="button"
            onClick={() => onOpenLetter(letter)}
            aria-label={`อ่านจดหมายจาก ${letter.from} ฉบับเต็ม`}
            className="absolute z-10 max-w-[184px] cursor-pointer rounded-xl border-[1.5px] border-[#E0AFA6] bg-[#FFFCF5] px-2.5 py-2 text-left text-xs leading-snug text-[#2E4535] shadow-[0_6px_14px_-10px_rgba(46,69,53,0.6)]"
            style={reader === "groom" ? { left: cropX + 10, top: NOTE_TOP } : { right: cropX + 10, top: NOTE_TOP }}
          >
            <span className="block text-[11px] font-medium">จาก {letter.from}</span>
            <span className="line-clamp-2 break-words">{letter.text}</span>
            <span
              aria-hidden="true"
              className="absolute -bottom-[7px] size-3 rotate-45 border-r-[1.5px] border-b-[1.5px] border-[#E0AFA6] bg-[#FFFCF5]"
              style={reader === "groom" ? { left: GROOM_LEFT + 52 - 10 - cropX } : { right: STAGE_W - BRIDE_LEFT - 110 - cropX }}
            />
          </button>
        ) : null}

        {throwing !== null ? (
          <motion.div
            key={throwing}
            className="pointer-events-none absolute z-20"
            style={{ left: throwFrom.x, top: throwFrom.y }}
            initial={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
            animate={{
              x: [0, (throwTo.x - throwFrom.x) / 2, throwTo.x - throwFrom.x],
              y: [0, throwTo.y - throwFrom.y - 60, throwTo.y - throwFrom.y],
              rotate: [0, 220, 340],
              scale: [1, 1.15, 0.9],
              opacity: [1, 1, 0],
            }}
            transition={{ duration: THROW_MS / 1000, ease: [0.3, 0.6, 0.4, 1], times: [0, 0.55, 1] }}
          >
            <Envelope width={26} />
          </motion.div>
        ) : null}
      </div>

      <button
        ref={lettersRef}
        type="button"
        onClick={onOpenLetters}
        aria-hidden={reading || undefined}
        tabIndex={reading ? -1 : undefined}
        className={`absolute top-2 right-2 z-10 flex h-9 items-center gap-1.5 rounded-full bg-[#E0AFA6] px-3 text-xs text-[#2E4535] transition-opacity duration-200 hover:bg-[#D9A399] ${
          reading ? "pointer-events-none opacity-0" : ""
        }`}
      >
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="5.5" width="18" height="13" rx="2" />
          <path d="M3.5 6.5 12 13l8.5-6.5" />
        </svg>
        จดหมาย <span className="font-medium">{letterCount}</span>
      </button>
    </div>
  )
}
