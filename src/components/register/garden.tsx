"use client"

import { useState, type ReactNode } from "react"
import { CoupleSprite, type CoupleMode } from "@/components/dashboard/couple-sprite"
import { COUPLE } from "@/lib/event"
import { FOLLOWER_ATLAS, GUEST_GRID } from "@/lib/guest-atlas"

/**
 * Small garden box from the v2.3 boards (W1 welcome, W2–W4 headers, W6 sheet):
 * butter ground, rose halo, two bushes, gingham floor and the couple in the middle.
 * Sizes are in px of the box; the couple is centred on the halo.
 */
export function Garden({
  height,
  coupleSize,
  floor,
  coupleTop,
  halo,
  haloTop,
  bubble,
  interactive = false,
  className = "",
  children,
}: {
  height: number
  /** Drawn size of each 256px couple cell. */
  coupleSize: number
  /** Height of the gingham band. */
  floor: number
  /** Top of the couple cells, from the boards. */
  coupleTop: number
  /** Rose halo diameter and top. */
  halo: number
  haloTop: number
  /** Speech bubble at the top centre. */
  bubble?: string
  /** Tap the couple to wave (W1). */
  interactive?: boolean
  className?: string
  children?: ReactNode
}) {
  const [mode, setMode] = useState<CoupleMode>("idle")
  const [playKey, setPlayKey] = useState(0)
  // Groom art sits right of centre in its cell and the bride left of it: overlap them like the boards.
  const overlap = Math.round(coupleSize * 0.44)

  const couple = (
    <span className="relative block" style={{ width: coupleSize * 2 - overlap, height: coupleSize }}>
      <span className="absolute top-0 left-0">
        <CoupleSprite
          key={`g-${mode}-${playKey}`}
          role="groom"
          mode={mode}
          playKey={playKey}
          size={coupleSize}
          onWaveDone={() => setMode("idle")}
        />
      </span>
      <span className="absolute top-0" style={{ left: coupleSize - overlap }}>
        <CoupleSprite key={`b-${mode}-${playKey}`} role="bride" mode={mode} playKey={playKey} size={coupleSize} />
      </span>
    </span>
  )

  return (
    <div
      className={`relative overflow-hidden rounded-[20px] border border-[#E6DCC4] bg-[#FFF8E6] ${className}`}
      style={{ height }}
    >
      <div aria-hidden="true" className="gingham absolute inset-x-0 bottom-0 border-t border-[#E6DCC4]" style={{ height: floor }} />
      <div
        aria-hidden="true"
        className="absolute left-1/2 rounded-full bg-[#F2D9D3]"
        style={{ width: halo, height: halo, marginLeft: -halo / 2, top: haloTop }}
      />
      <div
        aria-hidden="true"
        className="absolute rounded-full bg-[#7A9070]"
        style={{ left: -30, bottom: floor - 14, width: Math.round(height * 0.24), height: Math.round(height * 0.3) }}
      />
      <div
        aria-hidden="true"
        className="absolute rounded-full bg-[#8EA383]"
        style={{ right: -30, bottom: floor - 16, width: Math.round(height * 0.22), height: Math.round(height * 0.26) }}
      />
      <div className="absolute left-1/2 -translate-x-1/2" style={{ top: coupleTop }}>
        {interactive ? (
          <button
            type="button"
            aria-label={`แตะ${COUPLE.groomNickname}กับ${COUPLE.brideNickname}เพื่อทักทาย`}
            className="block cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E4535]"
            onClick={() => {
              setMode("wave")
              setPlayKey(Date.now())
            }}
          >
            {couple}
          </button>
        ) : (
          <span aria-hidden="true">{couple}</span>
        )}
      </div>
      {bubble ? (
        <span className="absolute top-2.5 left-1/2 -translate-x-1/2 rounded-full border border-[#2E4535] bg-[#FFFCF5] px-3 py-0.5 text-xs whitespace-nowrap text-[#2E4535]">
          {bubble}
        </span>
      ) : null}
      {children}
    </div>
  )
}

export function Envelope({ width = 22, className = "" }: { width?: number; className?: string }) {
  return (
    <svg aria-hidden="true" width={width} height={Math.round(width * 0.68)} viewBox="0 0 22 15" className={className}>
      <rect x="0.75" y="0.75" width="20.5" height="13.5" rx="1.5" fill="#FFFCF5" stroke="#CDBFAE" strokeWidth="1.5" />
      <path d="M1.5 1.5 L11 8.5 L20.5 1.5" fill="none" stroke="#CDBFAE" strokeWidth="1.5" />
      <circle cx="11" cy="8.6" r="2.4" fill="#E0AFA6" />
    </svg>
  )
}

export function daysUntil(iso: string) {
  const target = new Date(`${iso}T00:00:00+07:00`).getTime()
  return Math.max(0, Math.ceil((target - Date.now()) / 86_400_000))
}

/** "เสาร์ 20 พ.ย. 2570" */
export function shortDateThai(iso: string) {
  const date = new Date(`${iso}T12:00:00+07:00`)
  const weekday = date.toLocaleDateString("th-TH", { weekday: "long", timeZone: "Asia/Bangkok" }).replace(/^วัน/, "")
  const rest = date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" })
  return `${weekday} ${rest}`
}

/** One cell of guests-grid.png (same order as guests.png: 0–5 male, 6–11 female), drawn `height` px tall. */
export function GuestCell({ index, height, className = "" }: { index: number; height: number; className?: string }) {
  const scale = height / GUEST_GRID.height
  const width = GUEST_GRID.cell * scale
  return (
    <span
      aria-hidden="true"
      className={`block shrink-0 ${className}`}
      style={{
        width,
        height,
        backgroundImage: `url(${GUEST_GRID.href})`,
        backgroundSize: `${GUEST_GRID.width * scale}px ${height}px`,
        backgroundPosition: `${-index * width}px 0`,
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
      }}
    />
  )
}

/** One follower from followers.png, drawn `height` px tall. */
export function FollowerCell({ index, height, className = "" }: { index: number; height: number; className?: string }) {
  const scale = height / FOLLOWER_ATLAS.frameH
  const width = FOLLOWER_ATLAS.frameW * scale
  return (
    <span
      aria-hidden="true"
      className={`block shrink-0 ${className}`}
      style={{
        width,
        height,
        backgroundImage: `url(${FOLLOWER_ATLAS.href})`,
        backgroundSize: `${FOLLOWER_ATLAS.width * scale}px ${height}px`,
        backgroundPosition: `${-(index % FOLLOWER_ATLAS.count) * width}px 0`,
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
      }}
    />
  )
}
