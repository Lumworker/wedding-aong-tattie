import { COUPLE_PEEK } from "@/lib/couple-atlas"

/**
 * อ๋อง and แทตตี้ grip the top edge of a registration card.
 * Each sprite’s hands are the bottom of the file. Shifting up by 82%
 * leaves the collar above the card and the hands on the edge.
 */
export function CouplePeek() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-20">
      {/* Approved faces — keep the file bytes, do not run them through the image optimizer. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={COUPLE_PEEK.groom}
        alt=""
        draggable={false}
        className="absolute left-0 top-0 h-28 w-auto max-w-none -translate-y-[82%] select-none [image-rendering:pixelated] sm:h-36"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={COUPLE_PEEK.bride}
        alt=""
        draggable={false}
        className="absolute right-0 top-0 h-28 w-auto max-w-none -translate-y-[82%] select-none [image-rendering:pixelated] sm:h-36"
      />
    </div>
  )
}
