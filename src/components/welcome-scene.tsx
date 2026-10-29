"use client"

import { Character } from "@/components/venue/character"

/** Church behind the couple, then the pair. Pixel art stays on the characters. */
export function WelcomeScene({
  jumpFrame,
  compact = false,
}: {
  /** `null` is the idle portrait. A number is a jump-sheet frame. */
  jumpFrame: number | null
  /** Register CTA: a fixed scene height. Welcome uses the viewport grid instead. */
  compact?: boolean
}) {
  const size = compact ? 132 : 148
  return (
    <div
      className={
        compact
          ? "pointer-events-none relative mx-auto w-full"
          : "pointer-events-none flex h-full min-h-[7.5rem] w-full items-end justify-center"
      }
      aria-hidden="true"
    >
      <div className={compact ? undefined : "relative h-full max-h-[min(24rem,48dvh)] w-full"}>
        <svg
          viewBox="0 0 400 336"
          preserveAspectRatio={compact ? undefined : "xMidYMax meet"}
          className={
            compact
              ? "mx-auto h-64 w-full overflow-visible sm:h-80"
              : "absolute inset-0 h-full w-full overflow-visible"
          }
        >
          <image
            href="/sprites/church.png"
            x="112"
            y="6"
            width="176"
            height="264"
            opacity="0.68"
            style={{ imageRendering: "pixelated" }}
          />
          <g transform="translate(136 326)">
            <Character role="groom" mood="idle" showName={false} size={size} jumpFrame={jumpFrame} />
          </g>
          <g transform="translate(264 326)">
            <Character role="bride" mood="idle" showName={false} size={size} jumpFrame={jumpFrame} />
          </g>
        </svg>
      </div>
    </div>
  )
}
