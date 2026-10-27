import { PLANT_ATLAS } from "@/lib/plant-atlas"

/** Flower-forward indices look nicest on the altar and pew ends. */
export const ALTAR_PLANTS = [3, 4, 13, 15, 20, 22] as const
export const PEW_PLANTS = [0, 5, 8, 11, 16, 18, 21, 23] as const

export function PlantSprite({
  index,
  x,
  y,
  size,
}: {
  index: number
  x: number
  y: number
  size: number
}) {
  const i = ((index % PLANT_ATLAS.count) + PLANT_ATLAS.count) % PLANT_ATLAS.count
  const col = i % PLANT_ATLAS.cols
  const row = Math.floor(i / PLANT_ATLAS.cols)
  const sx = col * PLANT_ATLAS.cell
  const sy = row * PLANT_ATLAS.cell

  return (
    <svg x={x} y={y} width={size} height={size} viewBox={`${sx} ${sy} ${PLANT_ATLAS.cell} ${PLANT_ATLAS.cell}`} overflow="hidden">
      <image
        href={PLANT_ATLAS.href}
        width={PLANT_ATLAS.width}
        height={PLANT_ATLAS.height}
        style={{ imageRendering: "pixelated" }}
      />
    </svg>
  )
}
