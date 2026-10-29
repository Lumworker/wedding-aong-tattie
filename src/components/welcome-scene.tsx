"use client"

import { Character } from "@/components/venue/character"

/** Church behind the couple, then the pair. Pixel art stays on the characters. */
export function WelcomeScene({ jumpFrame }: { jumpFrame: number }) {
  return (
    <div className="relative mx-auto w-full" aria-hidden="true">
      <svg viewBox="0 0 400 336" className="mx-auto h-80 w-full overflow-visible sm:h-96">
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
          <Character role="groom" mood="idle" showName={false} size={148} jumpFrame={jumpFrame} />
        </g>
        <g transform="translate(264 326)">
          <Character role="bride" mood="idle" showName={false} size={148} jumpFrame={jumpFrame} />
        </g>
      </svg>
    </div>
  )
}
