"use client"

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import type { Wish } from "@/lib/types"
import { COUPLE_CLEAR, type PlacedGuest } from "@/lib/scene-layout"

/** SVG user-unit scale (screen px per scene unit). Bubbles divide by this so type stays readable. */
export const WishSceneScaleContext = createContext(1)

export function WishSceneScaleProvider({ scale, children }: { scale: number; children: ReactNode }) {
  return <WishSceneScaleContext.Provider value={scale}>{children}</WishSceneScaleContext.Provider>
}

export type WishSlot = {
  key: string
  wish: Wish
  guestId: string
}

const MAX_VISIBLE = 2
const MOBILE_MAX_VISIBLE = 1
const MOBILE_WISH_POOL = 3
const SPAWN_MS = 4200
const LIFE_MS = 9200

function pick<T>(items: T[], exclude?: T): T | null {
  if (!items.length) return null
  if (items.length === 1) return items[0]
  const pool = exclude === undefined ? items : items.filter((item) => item !== exclude)
  const list = pool.length ? pool : items
  return list[Math.floor(Math.random() * list.length)] ?? null
}

function guestIdForWish(
  wish: Wish,
  placed: PlacedGuest[],
  busy: Set<string>,
  sceneScale: number
): string | null {
  const safe = (item: PlacedGuest) =>
    !busy.has(item.guest.id) && guestClearsCouple(item, wish.from, wish.text, sceneScale)
  const party = placed.filter(
    (item) => !item.guest.isCompanion && item.guest.partyPhone === wish.partyPhone && safe(item)
  )
  const named = party.find((item) => item.guest.name === wish.from)
  if (named) return named.guest.id
  if (party[0]) return party[0].guest.id

  const open = placed.filter((item) => !item.guest.isCompanion && safe(item))
  return pick(open)?.guest.id ?? null
}

function bubbleBox(x: number, y: number, placed: PlacedGuest, from: string, text: string, sceneScale: number) {
  const scale = sceneScale > 0.05 ? sceneScale : 1
  const layout = bubbleLayout(from, text, scale)
  const width = (layout.screenW + 8) / scale
  const height = (layout.cardH + 22) / scale
  const anchorY = y + bubbleOffsetY(placed)
  return { x: x - width / 2, y: anchorY - height, width, height }
}

function hitsCoupleZone(box: { x: number; y: number; width: number; height: number }) {
  return (
    box.x < COUPLE_CLEAR.x1 &&
    box.x + box.width > COUPLE_CLEAR.x0 &&
    box.y < COUPLE_CLEAR.y1 &&
    box.y + box.height > COUPLE_CLEAR.y0
  )
}

/** True when this wish card would cover the couple if anchored on the guest. */
export function wishBubbleHitsCouple(
  x: number,
  y: number,
  placed: PlacedGuest,
  from: string,
  text: string,
  sceneScale: number
) {
  return hitsCoupleZone(bubbleBox(x, y, placed, from, text, sceneScale))
}

function guestClearsCouple(placed: PlacedGuest, from: string, text: string, sceneScale: number) {
  const points = placed.mood === "walk" ? placed.path : placed.path.slice(0, 1)
  return points.every((point) => !wishBubbleHitsCouple(point.x, point.y, placed, from, text, sceneScale))
}

function recentWishes(wishes: Wish[], narrow: boolean) {
  if (!narrow) return wishes
  return [...wishes].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, MOBILE_WISH_POOL)
}

function bubbleLayout(from: string, text: string, scale: number) {
  const count = Array.from(text).length
  const narrow = scale < 1.15
  const bodyPx = count <= 40 ? (narrow ? 14 : 16) : count <= 90 ? (narrow ? 13 : 14) : count <= 140 ? 12 : 11
  const namePx = 13
  const line = 1.55
  const screenW = count <= 40 ? 210 : count <= 90 ? 236 : 264
  const padX = 14
  const padY = 12
  const contentW = screenW - padX * 2
  const bodyPerLine = Math.max(6, Math.floor(contentW / (bodyPx * 0.95)))
  const namePerLine = Math.max(4, Math.floor(contentW / (namePx * 0.95)))
  const lines = Math.max(1, Math.ceil(Math.max(count, 1) / bodyPerLine))
  const nameLines = Math.max(1, Math.ceil(Math.max(Array.from(from).length, 1) / namePerLine))
  const cardH = padY * 2 + nameLines * namePx * line + 6 + lines * bodyPx * line + 8
  return { bodyPx, namePx, line, screenW, padX, padY, cardH, wide: count > 40 }
}

export function ChatBubble({ from, text }: { from: string; text: string }) {
  const sceneScale = useContext(WishSceneScaleContext)
  const scale = sceneScale > 0.05 ? sceneScale : 1
  const layout = bubbleLayout(from, text, scale)
  const { bodyPx, namePx, line, screenW, padX, padY, cardH, wide } = layout
  const u = (px: number) => px / scale
  const foW = u(screenW + 8)
  const foH = u(cardH + 22)

  return (
    <motion.g
      initial={{ opacity: 0, y: 10, scale: 0.88 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.92 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <motion.g
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <foreignObject
          x={-foW / 2}
          y={-foH}
          width={foW}
          height={foH}
          style={{ overflow: "visible", pointerEvents: "none" }}
        >
          <div style={{ position: "relative", width: "100%", height: "100%", pointerEvents: "none" }}>
            <div
              style={{
                position: "absolute",
                left: "50%",
                bottom: 0,
                transform: "translateX(-50%)",
                boxSizing: "border-box",
                width: wide ? "100%" : "max-content",
                maxWidth: "100%",
                minWidth: u(96),
                padding: `${u(padY)}px ${u(padX)}px ${u(padY)}px`,
                borderRadius: u(16),
                border: `${Math.max(1.5, u(2))}px solid #c4922a`,
                background: "#fffaf0",
                boxShadow: `0 ${u(8)}px ${u(18)}px rgba(10, 8, 16, 0.45)`,
              }}
            >
              <p
                style={{
                  margin: 0,
                  marginBottom: u(4),
                  fontSize: u(namePx),
                  fontWeight: 700,
                  lineHeight: line,
                  letterSpacing: "0.01em",
                  color: "#7a2438",
                  overflow: "visible",
                  whiteSpace: "normal",
                  overflowWrap: "anywhere",
                }}
              >
                {from}
              </p>
              <p
                className="font-serif"
                style={{
                  margin: 0,
                  fontSize: u(bodyPx),
                  lineHeight: line,
                  color: "#1c1612",
                  overflow: "visible",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}
              >
                {text}
              </p>
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  top: "100%",
                  left: "50%",
                  marginLeft: u(-7),
                  borderLeft: `${u(7)}px solid transparent`,
                  borderRight: `${u(7)}px solid transparent`,
                  borderTop: `${u(9)}px solid #c4922a`,
                }}
              />
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  top: "100%",
                  left: "50%",
                  marginLeft: u(-5),
                  marginTop: u(1.5),
                  borderLeft: `${u(5)}px solid transparent`,
                  borderRight: `${u(5)}px solid transparent`,
                  borderTop: `${u(7)}px solid #fffaf0`,
                }}
              />
            </div>
          </div>
        </foreignObject>
      </motion.g>
    </motion.g>
  )
}

function useNarrowScene() {
  const [narrow, setNarrow] = useState(false)

  useEffect(() => {
    const query = window.matchMedia("(max-width: 1023px)")
    const update = () => setNarrow(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])

  return narrow
}

export function useWishSlots(
  wishes: Wish[],
  placed: PlacedGuest[],
  enabled: boolean,
  sceneScale: number
): WishSlot[] {
  const reduced = useReducedMotion() === true
  const narrow = useNarrowScene()
  const live = enabled && wishes.length > 0 && placed.length > 0
  const [slots, setSlots] = useState<WishSlot[]>([])
  const [quietIndex, setQuietIndex] = useState(0)
  const wishRef = useRef<string | null>(null)
  const placedRef = useRef(placed)
  const scaleRef = useRef(sceneScale)
  placedRef.current = placed
  scaleRef.current = sceneScale

  const sceneWishes = useMemo(() => recentWishes(wishes, narrow), [wishes, narrow])
  const guestIds = useMemo(() => placed.map((item) => item.guest.id).join("|"), [placed])
  const maxVisible = narrow ? MOBILE_MAX_VISIBLE : MAX_VISIBLE

  useEffect(() => {
    if (!live) {
      setSlots([])
      return
    }

    if (reduced) {
      const id = window.setInterval(() => setQuietIndex((n) => n + 1), 7000)
      return () => window.clearInterval(id)
    }

    let cancelled = false
    const timers = new Set<number>()

    function spawn() {
      if (cancelled) return
      setSlots((current) => {
        if (current.length >= maxVisible) return current
        const busy = new Set(current.map((slot) => slot.guestId))
        const wishPool = sceneWishes.filter((wish) => wish.id !== wishRef.current)
        const wish = pick(wishPool.length ? wishPool : sceneWishes)
        if (!wish) return current
        const guestId = guestIdForWish(wish, placedRef.current, busy, scaleRef.current)
        if (!guestId) return current
        wishRef.current = wish.id
        const key = `${wish.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        const removeId = window.setTimeout(() => {
          timers.delete(removeId)
          if (!cancelled) {
            setSlots((items) => items.filter((item) => item.key !== key))
          }
        }, LIFE_MS)
        timers.add(removeId)
        return [...current, { key, wish, guestId }]
      })
    }

    spawn()
    const interval = window.setInterval(spawn, SPAWN_MS)
    return () => {
      cancelled = true
      window.clearInterval(interval)
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [live, reduced, sceneWishes, guestIds, maxVisible])

  if (!live) return []

  if (reduced) {
    if (!sceneWishes.length) return []
    const wish = sceneWishes[quietIndex % sceneWishes.length]
    const guestId = guestIdForWish(wish, placed, new Set(), sceneScale)
    if (!guestId) return []
    return [{ key: `quiet-${wish.id}-${guestId}`, wish, guestId }]
  }

  return slots
}

/** Head offset in scene units (outside character scale) for chat bubble anchor. */
export function bubbleOffsetY(placed: PlacedGuest): number {
  const body = placed.guest.isCompanion ? 59 : 80
  const sit = placed.mood === "sit" ? 0.86 : 1
  return -(body * sit * placed.scale + 6)
}
