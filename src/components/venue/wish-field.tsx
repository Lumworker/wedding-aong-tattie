"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import type { Wish } from "@/lib/types"

const SLOTS = [
  { left: "8%", delay: 0 },
  { left: "28%", delay: 2.4 },
  { left: "52%", delay: 1.1 },
  { left: "72%", delay: 3.2 },
]

export function WishField({ wishes, enabled }: { wishes: Wish[]; enabled: boolean }) {
  const reduced = useReducedMotion() === true
  const [tick, setTick] = useState(0)
  const live = enabled && wishes.length > 0

  useEffect(() => {
    if (!live || reduced) return
    const id = window.setInterval(() => setTick((n) => n + 1), 5200)
    return () => window.clearInterval(id)
  }, [live, reduced])

  const floating = useMemo(() => {
    if (!live) return []
    return SLOTS.map((slot, index) => {
      const wish = wishes[(tick + index) % wishes.length]
      return { ...slot, wish, key: `${wish.id}-${tick}-${index}` }
    })
  }, [live, tick, wishes])

  if (!live) return null

  if (reduced) {
    return (
      <div className="pointer-events-none absolute inset-x-3 top-16 z-10 flex flex-col gap-2" aria-live="polite">
        {wishes.slice(-3).map((wish) => (
          <p key={wish.id} className="max-w-[16rem] rounded-2xl bg-[#fff8e8]/90 px-3 py-2 text-sm text-ink shadow-sm">
            <span className="block font-medium">{wish.from}</span>
            {wish.text}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
      <AnimatePresence>
        {floating.map((item) => (
          <motion.p
            key={item.key}
            className="absolute max-w-[11.5rem] rounded-2xl border border-[#e8c878]/50 bg-[#fff8e8]/88 px-3 py-2 font-serif text-sm leading-5 text-ink shadow-[0_12px_30px_-18px_rgba(42,38,35,0.7)]"
            style={{ left: item.left, bottom: "18%" }}
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: [0, 1, 1, 0], y: [24, -8, -120, -180], scale: [0.92, 1, 1, 0.96] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 7.2, delay: item.delay * 0.08, ease: "easeOut" }}
          >
            <span className="mb-0.5 block text-[11px] tracking-wide text-rose">{item.wish.from}</span>
            {item.wish.text}
          </motion.p>
        ))}
      </AnimatePresence>
    </div>
  )
}
