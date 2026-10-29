"use client"

import type { CSSProperties } from "react"
import { Character } from "@/components/venue/character"
import { WELCOME_PROPS } from "@/lib/prop-sprites"

const PIXEL: CSSProperties = { imageRendering: "pixelated" }

/**
 * Pair bounding box fills this viewBox, and the viewBox fills the couple slot.
 * Sprite 148 keeps the same 240:140 box ratio as 116, so heads, feet, and the
 * jump sheet stay inside the slot.
 */
const COUPLE = { w: 306, h: 178.5, sprite: 148, foot: 168, groom: 74, bride: 232 } as const

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

/** Welcome lawn: couple only. Falling petals live on the page. */
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
    <div className="welcome-scene" aria-hidden="true">
      <div data-prop="couple" className="welcome-couple">
          <svg viewBox={`0 0 ${COUPLE.w} ${COUPLE.h}`} className="absolute inset-0 h-full w-full overflow-visible">
            <ellipse cx={COUPLE.groom} cy={COUPLE.foot - 2} rx="28" ry="6" fill="#6d7b62" opacity="0.28" />
            <ellipse cx={COUPLE.bride} cy={COUPLE.foot - 2} rx="28" ry="6" fill="#6d7b62" opacity="0.28" />
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
    </div>
  )
}
