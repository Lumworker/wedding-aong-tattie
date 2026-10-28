"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import type { Wish } from "@/lib/types"
import type { PlacedGuest } from "@/lib/scene-layout"

export type WishSlot = {
  key: string
  wish: Wish
  guestId: string
}

const MAX_VISIBLE = 2
const SPAWN_MS = 4200
const LIFE_MS = 9200

function pick<T>(items: T[], exclude?: T): T | null {
  if (!items.length) return null
  if (items.length === 1) return items[0]
  const pool = exclude === undefined ? items : items.filter((item) => item !== exclude)
  const list = pool.length ? pool : items
  return list[Math.floor(Math.random() * list.length)] ?? null
}

function guestIdForWish(wish: Wish, placed: PlacedGuest[], busy: Set<string>): string | null {
  const party = placed.filter(
    (item) => !item.guest.isCompanion && item.guest.partyPhone === wish.partyPhone && !busy.has(item.guest.id)
  )
  const named = party.find((item) => item.guest.name === wish.from)
  if (named) return named.guest.id
  if (party[0]) return party[0].guest.id

  const open = placed.filter((item) => !item.guest.isCompanion && !busy.has(item.guest.id))
  return pick(open)?.guest.id ?? null
}

function clipWish(text: string, max = 36) {
  const glyphs = Array.from(text)
  if (glyphs.length <= max) return text
  return `${glyphs.slice(0, max - 1).join("")}…`
}

export function ChatBubble({ from, text }: { from: string; text: string }) {
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
        <foreignObject x={-58} y={-46} width={116} height={44} style={{ overflow: "visible" }}>
          <div className="pointer-events-none flex justify-center">
            <div className="relative max-w-[6.75rem] rounded-xl border border-[#e0b85a] bg-[#fffaf0] px-2 py-1 shadow-[0_6px_14px_rgba(10,8,16,0.35)]">
              <p className="m-0 mb-0.5 text-[8px] font-semibold leading-none tracking-wide text-[#b04558]">
                {from}
              </p>
              <p className="m-0 font-serif text-[10px] leading-snug text-[#241f1c]">{clipWish(text)}</p>
              <span
                aria-hidden
                className="absolute top-full left-1/2 -ml-[5px] border-x-[5px] border-t-[6px] border-x-transparent border-t-[#e0b85a]"
              />
              <span
                aria-hidden
                className="absolute top-full left-1/2 -ml-[4px] border-x-[4px] border-t-[5px] border-x-transparent border-t-[#fffaf0]"
              />
            </div>
          </div>
        </foreignObject>
      </motion.g>
    </motion.g>
  )
}

export function useWishSlots(
  wishes: Wish[],
  placed: PlacedGuest[],
  enabled: boolean
): WishSlot[] {
  const reduced = useReducedMotion() === true
  const live = enabled && wishes.length > 0 && placed.length > 0
  const [slots, setSlots] = useState<WishSlot[]>([])
  const [quietIndex, setQuietIndex] = useState(0)
  const wishRef = useRef<string | null>(null)
  const placedRef = useRef(placed)
  placedRef.current = placed

  const guestIds = useMemo(() => placed.map((item) => item.guest.id).join("|"), [placed])

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
        if (current.length >= MAX_VISIBLE) return current
        const busy = new Set(current.map((slot) => slot.guestId))
        const wishPool = wishes.filter((wish) => wish.id !== wishRef.current)
        const wish = pick(wishPool.length ? wishPool : wishes)
        if (!wish) return current
        const guestId = guestIdForWish(wish, placedRef.current, busy)
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
  }, [live, reduced, wishes, guestIds])

  if (!live) return []

  if (reduced) {
    const wish = wishes[quietIndex % wishes.length]
    const guestId = guestIdForWish(wish, placed, new Set())
    if (!guestId) return []
    return [{ key: `quiet-${wish.id}-${guestId}`, wish, guestId }]
  }

  return slots
}

/** Head offset in scene units (outside character scale) for chat bubble anchor. */
export function bubbleOffsetY(placed: PlacedGuest): number {
  const body = placed.guest.isCompanion ? 20 : 80
  return -(body * placed.scale + 4)
}
