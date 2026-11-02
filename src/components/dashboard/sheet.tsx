"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"

/** Bottom sheet on phones, a centered panel from lg. Escape and the backdrop close it. */
export function Sheet({
  open,
  title,
  onClose,
  children,
  tone = "default",
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  tone?: "default" | "danger"
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    returnFocus.current = document.activeElement as HTMLElement | null
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }))
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("keydown", onKey)
      returnFocus.current?.focus?.({ preventScroll: true })
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center">
          <motion.button
            type="button"
            aria-label="ปิด"
            tabIndex={-1}
            className="absolute inset-0 cursor-default bg-[#2E4535]/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`relative flex max-h-[88dvh] w-full max-w-lg flex-col gap-3.5 overflow-y-auto rounded-t-[24px] border-t bg-[#FFFCF5] px-5 pt-2.5 pb-[max(env(safe-area-inset-bottom),1.5rem)] shadow-[0_-4px_16px_rgba(46,69,53,0.08)] lg:rounded-[24px] lg:border ${
              tone === "danger" ? "border-[#9A3B2E]" : "border-[#E6DCC4]"
            }`}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div aria-hidden="true" className="mx-auto h-1.5 w-11 shrink-0 rounded-full bg-[#E6DCC4] lg:hidden" />
            <div className="-mt-1 flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold text-[#2E4535]">{title}</h2>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="ปิด"
                className="-mr-2.5 flex size-11 items-center justify-center rounded-full text-[#2E4535] hover:bg-[#F6F1E8]"
              >
                <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
