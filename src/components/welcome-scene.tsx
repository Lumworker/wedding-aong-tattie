"use client"

import type { CSSProperties } from "react"
import { Character } from "@/components/venue/character"
import { WELCOME_PROPS } from "@/lib/prop-sprites"
import { cn } from "@/lib/utils"

const PIXEL: CSSProperties = { imageRendering: "pixelated" }

const GROUND_PETALS = [
  { left: "24%", bottom: "15%", size: 8, rotate: -18, color: "#F0B7C4" },
  { left: "36%", bottom: "11%", size: 6, rotate: 24, color: "#E89AAD" },
  { left: "46%", bottom: "17%", size: 7, rotate: 12, color: "#F6C9D2" },
  { left: "56%", bottom: "10%", size: 5, rotate: -28, color: "#E7A8B6" },
  { left: "66%", bottom: "14%", size: 8, rotate: 16, color: "#F3C0CB" },
  { left: "42%", bottom: "8%", size: 5, rotate: 40, color: "#F7D0D8" },
] as const

function PropImage({
  src,
  className,
  width,
  height,
}: {
  src: string
  className?: string
  width: number
  height: number
}) {
  return (
    <div
      className={cn("pointer-events-none absolute bg-[length:100%_100%] bg-no-repeat select-none", className)}
      style={{
        ...PIXEL,
        backgroundImage: `url("${src}")`,
        aspectRatio: `${width} / ${height}`,
      }}
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
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -top-[18%] -left-[10%] h-[72%] w-[68%] bg-[radial-gradient(ellipse_at_center,rgba(255,252,248,0.92),transparent_68%)]" />
      <div className="absolute inset-x-0 top-[34%] h-[26%] bg-[radial-gradient(ellipse_at_center,rgba(198,220,204,0.42),transparent_70%)]" />
      <div className="absolute inset-x-0 bottom-0 hidden h-[40%] bg-[linear-gradient(180deg,transparent,rgba(246,214,220,0.5))] lg:block" />
      <div className="absolute inset-x-0 bottom-0 h-[44%] bg-[linear-gradient(180deg,rgba(248,232,236,0),rgba(220,234,226,0.9))] lg:hidden" />

      <div className="absolute inset-x-0 top-0 h-[var(--scene-h)] lg:inset-y-0 lg:right-[28rem] lg:h-auto">
        <PropImage
          src={WELCOME_PROPS.silhouette}
          width={404}
          height={605}
          className="top-[1%] left-1/2 w-[68%] max-w-[400px] -translate-x-1/2 opacity-60 lg:top-[5%] lg:w-[56%]"
        />
        <PropImage
          src={WELCOME_PROPS.treeAlt}
          width={313}
          height={463}
          className="wd-sway bottom-[16%] left-[-1%] w-[36%] max-w-[220px] origin-bottom lg:bottom-[14%] lg:left-[2%] lg:w-[28%]"
        />
        <PropImage
          src={WELCOME_PROPS.tree}
          width={323}
          height={465}
          className="wd-sway bottom-[13%] left-[16%] w-[32%] max-w-[200px] origin-bottom lg:bottom-[11%] lg:left-[18%] lg:w-[26%]"
        />
        <PropImage
          src={WELCOME_PROPS.tree}
          width={323}
          height={465}
          className="wd-sway bottom-[15%] right-[1%] w-[34%] max-w-[210px] origin-bottom lg:right-[3%] lg:bottom-[13%] lg:w-[26%]"
        />

        <div className="absolute bottom-[7%] left-1/2 w-[74%] max-w-[440px] -translate-x-1/2 lg:bottom-[9%] lg:w-[62%]">
          <div
            className="w-full bg-[length:100%_100%] bg-no-repeat select-none"
            style={{
              ...PIXEL,
              backgroundImage: `url("${WELCOME_PROPS.arch}")`,
              aspectRatio: "585 / 615",
            }}
          />
          <div className="absolute top-[33%] left-1/2 z-30 w-[32%] -translate-x-1/2">
            <div className="wd-bell origin-top">
              <div
                className="w-full bg-[length:100%_100%] bg-no-repeat select-none"
                style={{
                  ...PIXEL,
                  backgroundImage: `url("${WELCOME_PROPS.bell}")`,
                  aspectRatio: "397 / 622",
                }}
              />
            </div>
          </div>
        </div>

        <div className="absolute bottom-[8%] left-1/2 h-[15%] w-[78%] max-w-[520px] -translate-x-1/2 lg:bottom-[10%]">
          <div className="absolute inset-x-[18%] bottom-0 h-[40%] rounded-[100%] bg-[#c9b48a]/50" />
          <div className="absolute inset-x-0 bottom-[12%] h-[58%] rounded-[100%] bg-[#7ea15c]" />
          <div className="absolute inset-x-[8%] bottom-[24%] h-[40%] rounded-[100%] bg-[#b6cb72]" />
          <div className="absolute inset-x-[22%] bottom-[34%] h-[22%] rounded-[100%] bg-[#d7e39a]/80" />
        </div>

        {GROUND_PETALS.map((petal) => (
          <span
            key={`${petal.left}-${petal.bottom}`}
            className="absolute rounded-full"
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

        <div className="absolute bottom-[10%] left-1/2 z-20 w-[62%] max-w-[400px] -translate-x-1/2 lg:bottom-[12%] lg:w-[52%]">
          <svg viewBox="0 0 420 230" className="h-auto w-full overflow-visible">
            <ellipse cx="150" cy="214" rx="42" ry="9" fill="#5c4638" opacity="0.2" />
            <ellipse cx="284" cy="214" rx="42" ry="9" fill="#5c4638" opacity="0.2" />
            <g transform="translate(150 218)">
              <Character role="groom" mood="idle" showName={false} animateWave size={158} jumpFrame={jumpFrame} />
            </g>
            <g transform="translate(284 218)">
              <Character role="bride" mood="idle" showName={false} animateWave size={158} jumpFrame={jumpFrame} />
            </g>
          </svg>
        </div>
      </div>

      <PropImage
        src={WELCOME_PROPS.groundFlowers}
        width={671}
        height={404}
        className="bottom-[calc(100%-var(--scene-h))] left-[-8%] z-40 w-[48%] lg:bottom-[-2%] lg:left-[-1%] lg:w-[24%] lg:max-w-[320px]"
      />
      <PropImage
        src={WELCOME_PROPS.groundFlowers}
        width={671}
        height={404}
        className="right-[-10%] bottom-[calc(100%-var(--scene-h))] z-40 w-[48%] scale-x-[-1] lg:right-[-1%] lg:bottom-[-3%] lg:w-[24%] lg:max-w-[320px]"
      />
    </div>
  )
}
