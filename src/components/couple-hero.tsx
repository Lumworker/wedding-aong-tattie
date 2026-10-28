"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { Character } from "@/components/venue/character"
import { COUPLE } from "@/lib/event"
import { cn } from "@/lib/utils"

export function CoupleHero({
  className,
  hint = true,
}: {
  className?: string
  hint?: boolean
}) {
  const reduced = useReducedMotion() === true

  return (
    <Link
      href="/story"
      className={cn(
        "group mx-auto flex w-fit flex-col items-center rounded-3xl outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
      aria-label={`อ่านประวัติ ${COUPLE.groomNickname} และ ${COUPLE.brideNickname}`}
    >
      <motion.div
        className="relative"
        whileHover={reduced ? undefined : { scale: 1.12 }}
        whileTap={reduced ? undefined : { scale: 1.18 }}
        transition={{ type: "spring", stiffness: 320, damping: 18 }}
      >
        <svg viewBox="0 0 220 150" className="h-36 w-56 overflow-visible" aria-hidden="true">
          <ellipse cx="110" cy="138" rx="70" ry="8" fill="#2A2623" opacity="0.06" />
          <g transform="translate(78 142) scale(0.92)">
            <Character role="groom" mood="idle" showName={false} />
          </g>
          <g transform="translate(142 142) scale(0.92)">
            <Character role="bride" mood="idle" showName={false} />
          </g>
          <text x="110" y="58" textAnchor="middle" fill="#C48984" fontSize="16" className="wd-heart">
            ♥
          </text>
        </svg>
      </motion.div>
      {hint ? (
        <p className="mt-1 text-center text-[13px] leading-normal text-muted-foreground group-hover:text-rose">
          <span className="sm:hidden">แตะที่ตัว — อ่านประวัติอ๋องและแทตตี้</span>
          <span className="hidden sm:inline">แตะหรือวางเมาส์ที่ตัว — อ่านประวัติอ๋องและแทตตี้</span>
        </p>
      ) : null}
    </Link>
  )
}
