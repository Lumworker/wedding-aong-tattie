"use client"

import type { CSSProperties } from "react"
import { Character } from "@/components/venue/character"
import { WELCOME_PROPS } from "@/lib/prop-sprites"
import { cn } from "@/lib/utils"

const PIXEL: CSSProperties = { imageRendering: "pixelated" }

/**
 * Pair bounding box fills this viewBox, and the viewBox fills the couple slot
 * (24% of the desktop frame, 0.85× on mobile). Size is viewBox units, not pixels.
 */
const COUPLE = { w: 240, h: 140, sprite: 116, foot: 132, groom: 58, bride: 182 } as const

const GROUND_PETALS = [
  { left: "36%", bottom: "10%", size: 8, rotate: -18, color: "#F0B7C4" },
  { left: "42%", bottom: "7%", size: 6, rotate: 24, color: "#E89AAD" },
  { left: "50%", bottom: "11%", size: 7, rotate: 12, color: "#F6C9D2" },
  { left: "58%", bottom: "6%", size: 5, rotate: -28, color: "#E7A8B6" },
  { left: "64%", bottom: "9%", size: 8, rotate: 16, color: "#F3C0CB" },
  { left: "46%", bottom: "5%", size: 5, rotate: 40, color: "#F7D0D8" },
] as const

function PropImage({
  src,
  className,
  width,
  height,
  prop,
  swing = false,
}: {
  src: string
  className?: string
  width: number
  height: number
  prop: string
  swing?: boolean
}) {
  const ratio = { aspectRatio: `${width} / ${height}` }
  if (swing) {
    return (
      <div data-prop={prop} className={cn("welcome-prop", className)} style={ratio}>
        <div
          className="wd-bell"
          style={{ ...PIXEL, backgroundImage: `url("${src}")` }}
        />
      </div>
    )
  }
  return (
    <div
      data-prop={prop}
      className={cn("welcome-prop", className)}
      style={{ ...ratio, ...PIXEL, backgroundImage: `url("${src}")` }}
    />
  )
}

/** Register step: a fixed chapel-and-couple, not the full welcome lawn. */
function CompactWelcome({ jumpFrame }: { jumpFrame: number | null }) {
  return (
    <div className="pointer-events-none relative mx-auto w-full" aria-hidden="true">
      <svg viewBox="0 0 400 336" className="mx-auto h-64 w-full overflow-visible sm:h-80">
        <image
          href={WELCOME_PROPS.silhouette}
          x="108"
          y="20"
          width="184"
          height="276"
          opacity="0.72"
          style={PIXEL}
        />
        <g transform="translate(136 326)">
          <Character role="groom" mood="idle" showName={false} size={132} jumpFrame={jumpFrame} />
        </g>
        <g transform="translate(264 326)">
          <Character role="bride" mood="idle" showName={false} size={132} jumpFrame={jumpFrame} />
        </g>
      </svg>
    </div>
  )
}

/** Silhouette, trees, and arch sit behind the couple. Flowers and the bell stay in front. */
export function WelcomeScene({
  jumpFrame,
  compact = false,
}: {
  /** `null` is the idle portrait. A number is a jump-sheet frame. */
  jumpFrame: number | null
  /** Register CTA: a fixed scene height. Welcome uses the lawn. */
  compact?: boolean
}) {
  if (compact) return <CompactWelcome jumpFrame={jumpFrame} />
  return (
    <div className="welcome-frame" aria-hidden="true">
      <div className="welcome-stage">
        <div className="absolute -top-[12%] -left-[8%] h-[70%] w-[72%] bg-[radial-gradient(ellipse_at_center,rgba(255,252,248,0.92),transparent_68%)]" />
        <div className="absolute inset-x-0 top-[22%] h-[28%] bg-[radial-gradient(ellipse_at_center,rgba(198,220,204,0.4),transparent_70%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[38%] bg-[linear-gradient(180deg,transparent,rgba(220,234,226,0.88))]" />

        <PropImage
          prop="silhouette"
          src={WELCOME_PROPS.silhouette}
          width={404}
          height={605}
          className="welcome-silhouette"
        />
        <PropImage
          prop="tree-left"
          src={WELCOME_PROPS.treeAlt}
          width={313}
          height={463}
          className="welcome-tree welcome-tree-left wd-sway"
        />
        <PropImage
          prop="tree-mid"
          src={WELCOME_PROPS.tree}
          width={323}
          height={465}
          className="welcome-tree welcome-tree-mid wd-sway"
        />
        <PropImage
          prop="tree-right"
          src={WELCOME_PROPS.tree}
          width={323}
          height={465}
          className="welcome-tree welcome-tree-right wd-sway"
        />
        <PropImage
          prop="arch"
          src={WELCOME_PROPS.arch}
          width={585}
          height={615}
          className="welcome-arch"
        />

        <div data-prop="path" className="welcome-path">
          <div className="absolute inset-x-[4%] bottom-0 h-[78%] rounded-[100%] bg-[#c9b48a]/55" />
        </div>
        <div data-prop="grass" className="welcome-grass">
          <div className="absolute inset-x-[16%] bottom-0 h-[42%] rounded-[100%] bg-[#c9b48a]/45" />
          <div className="absolute inset-x-0 bottom-[10%] h-[58%] rounded-[100%] bg-[#7ea15c]" />
          <div className="absolute inset-x-[8%] bottom-[24%] h-[42%] rounded-[100%] bg-[#b6cb72]" />
          <div className="absolute inset-x-[22%] bottom-[36%] h-[24%] rounded-[100%] bg-[#d7e39a]/80" />
        </div>

        {GROUND_PETALS.map((petal) => (
          <span
            key={`${petal.left}-${petal.bottom}`}
            className="absolute z-[6] rounded-full"
            style={{
              left: petal.left,
              bottom: petal.bottom,
              width: petal.size,
              height: petal.size * 0.72,
              background: petal.color,
              transform: `rotate(${petal.rotate}deg)`,
            }}
          />
        ))}

        <div data-prop="couple" className="welcome-couple">
          <svg viewBox={`0 0 ${COUPLE.w} ${COUPLE.h}`} className="absolute inset-0 h-full w-full overflow-visible">
            <ellipse cx={COUPLE.groom} cy={COUPLE.foot - 2} rx="28" ry="6" fill="#5c4638" opacity="0.2" />
            <ellipse cx={COUPLE.bride} cy={COUPLE.foot - 2} rx="28" ry="6" fill="#5c4638" opacity="0.2" />
            <g transform={`translate(${COUPLE.groom} ${COUPLE.foot})`}>
              <Character
                role="groom"
                mood="idle"
                showName={false}
                animateWave
                size={COUPLE.sprite}
                jumpFrame={jumpFrame}
              />
            </g>
            <g transform={`translate(${COUPLE.bride} ${COUPLE.foot})`}>
              <Character
                role="bride"
                mood="idle"
                showName={false}
                animateWave
                size={COUPLE.sprite}
                jumpFrame={jumpFrame}
              />
            </g>
          </svg>
        </div>

        <PropImage
          prop="bell"
          src={WELCOME_PROPS.bell}
          width={397}
          height={622}
          className="welcome-bell"
          swing
        />
        <PropImage
          prop="flowers-left"
          src={WELCOME_PROPS.groundFlowers}
          width={671}
          height={404}
          className="welcome-flowers welcome-flowers-left"
        />
        <PropImage
          prop="flowers-right"
          src={WELCOME_PROPS.groundFlowers}
          width={671}
          height={404}
          className="welcome-flowers welcome-flowers-right"
        />
      </div>
    </div>
  )
}
