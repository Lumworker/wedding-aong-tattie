"use client"

import Link from "next/link"
import { useState } from "react"
import { CoupleSprite, type CoupleMode, type CoupleRole } from "@/components/dashboard/couple-sprite"
import { ROUTES, withQuery } from "@/lib/routes"
import { cn } from "@/lib/utils"

export const ABOUT_ROUTES = { aong: "/about/aong", tattie: "/about/tattie" } as const

/** Back to the dashboard + the อ๋อง / แทตตี้ switch. Same shape on both pages, two skins. */
export function AboutHeader({ active, tone, right }: { active: "aong" | "tattie"; tone: "dark" | "light"; right?: React.ReactNode }) {
  const dark = tone === "dark"
  const tab = "flex flex-1 items-center justify-center rounded-full text-sm"
  const on = dark ? "bg-[#8A9DB5] font-semibold text-[#1F2E25]" : "bg-[#E0AFA6] font-semibold text-[#2E4535]"
  const off = dark ? "text-[#FFF8E6] hover:bg-white/5" : "text-[#2E4535] hover:bg-[#F6F1E8]"
  return (
    <header className="relative z-20 flex h-[60px] items-center gap-1.5 pr-2 pl-1">
      <Link
        href={withQuery(ROUTES.dashboard)}
        aria-label="กลับหน้างาน"
        className={cn("flex size-11 shrink-0 items-center justify-center rounded-full", dark ? "text-[#FFF8E6] hover:bg-white/5" : "text-[#2E4535] hover:bg-[#FFF8E6]")}
      >
        <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </Link>
      <nav
        aria-label="เลือกคน"
        className={cn(
          "flex h-11 flex-1 rounded-full p-[3px]",
          dark ? "border border-[#8A9DB5]/35 bg-white/[0.06]" : "border border-[#E6DCC4] bg-[#FFFCF5]"
        )}
      >
        {(["aong", "tattie"] as const).map((key) =>
          key === active ? (
            <span key={key} aria-current="page" className={cn(tab, on)}>
              {key === "aong" ? "อ๋อง" : "แทตตี้"}
            </span>
          ) : (
            <Link key={key} href={withQuery(ABOUT_ROUTES[key])} replace className={cn(tab, off)}>
              {key === "aong" ? "อ๋อง" : "แทตตี้"}
            </Link>
          )
        )}
      </nav>
      <div className="flex w-11 shrink-0 justify-center">{right}</div>
    </header>
  )
}

/** Idle portrait; a tap plays the locked wave strip once (timings from couple-atlas). */
export function WavingSprite({ role, size, label, className }: { role: CoupleRole; size: number; label: string; className?: string }) {
  const [mode, setMode] = useState<CoupleMode>("idle")
  const [playKey, setPlayKey] = useState(0)
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        setPlayKey((key) => key + 1)
        setMode("wave")
      }}
      className={cn("block rounded-full focus-visible:outline-2 focus-visible:outline-offset-4", className)}
      style={{ width: size, height: size }}
    >
      <CoupleSprite key={`${mode}-${playKey}`} role={role} mode={mode} playKey={playKey} size={size} onWaveDone={() => setMode("idle")} />
    </button>
  )
}

/** The 7×10 pixel arrow used by the swarm and the page cursor. */
export const ARROW_OUTER = "M0 0h1v1h1v1h1v1h1v1h1v1h1v1h1v1H4v1h1v2H4V9H3V8H2v1H1v1H0z"
export const ARROW_INNER = "M1 2h1v1h1v1h1v1h1v1H4v1H3v1H2v1H1z"

export function PixelArrow({ fill, size = 14 }: { fill: string; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={(size * 10) / 7} viewBox="0 0 7 10" shapeRendering="crispEdges">
      <path d={ARROW_OUTER} fill="#FFF8E6" />
      <path d={ARROW_INNER} fill={fill} />
    </svg>
  )
}

export const WISH_HREF = () => {
  const base = withQuery(ROUTES.dashboard)
  return `${base}${base.includes("?") ? "&" : "?"}compose=wish`
}
