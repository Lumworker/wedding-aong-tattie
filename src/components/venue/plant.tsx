import { FLOWERS, PLANT_SHEET, TUFTS, type PlantFrame } from "@/lib/plant-atlas"

/** Rose bush, vines, and a few stems for the altar. */
export const ALTAR_FLOWERS = [0, 1, 2, 3, 5] as const
/** Single blooms for pew ends. */
export const PEW_FLOWERS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as const

export function PlantSprite({
  frame,
  x,
  y,
  pixel = 2,
  sway = false,
  delay = 0,
}: {
  frame: PlantFrame
  x: number
  y: number
  pixel?: number
  sway?: boolean
  delay?: number
}) {
  const width = frame.w * pixel
  const height = frame.h * pixel
  return (
    <g className={sway ? "wd-sway" : undefined} style={sway ? { animationDelay: `${delay}s` } : undefined}>
      <svg
        x={x}
        y={y - height}
        width={width}
        height={height}
        viewBox={`${frame.x} ${frame.y} ${frame.w} ${frame.h}`}
        overflow="hidden"
      >
        <image
          href={PLANT_SHEET.href}
          width={PLANT_SHEET.width}
          height={PLANT_SHEET.height}
          style={{ imageRendering: "pixelated" }}
        />
      </svg>
    </g>
  )
}

export function FlowerSprite({
  index,
  x,
  y,
  pixel = 2,
  sway = true,
}: {
  index: number
  x: number
  y: number
  pixel?: number
  sway?: boolean
}) {
  const frame = FLOWERS[((index % FLOWERS.length) + FLOWERS.length) % FLOWERS.length]
  return <PlantSprite frame={frame} x={x} y={y} pixel={pixel} sway={sway} delay={(index % 5) * 0.35} />
}

export function TuftSprite({ index, x, y }: { index: number; x: number; y: number }) {
  const frame = TUFTS[((index % TUFTS.length) + TUFTS.length) % TUFTS.length]
  return <PlantSprite frame={frame} x={x} y={y} pixel={2} sway delay={index * 0.2} />
}
