"use client"

import type { CSSProperties } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { PLANT_ATLAS } from "@/lib/plant-atlas"

/** Blooming / floral plants for soft falling décor. */
const FLOAT_INDICES = [3, 4, 13, 15, 20, 22] as const

const PETALS = [
  { left: "6%", delay: 0, duration: 13, size: 22, drift: 18, plant: 0 },
  { left: "16%", delay: 1.4, duration: 15, size: 18, drift: -14, plant: 1 },
  { left: "28%", delay: 0.6, duration: 12, size: 24, drift: 10, plant: 2 },
  { left: "39%", delay: 2.2, duration: 16, size: 18, drift: -20, plant: 3 },
  { left: "51%", delay: 0.2, duration: 14, size: 22, drift: 16, plant: 4 },
  { left: "63%", delay: 1.8, duration: 13, size: 18, drift: -12, plant: 5 },
  { left: "74%", delay: 0.9, duration: 17, size: 26, drift: 22, plant: 0 },
  { left: "86%", delay: 2.6, duration: 12.5, size: 20, drift: -16, plant: 1 },
  { left: "12%", delay: 3.1, duration: 15, size: 16, drift: 12, plant: 2 },
  { left: "47%", delay: 3.6, duration: 14, size: 20, drift: -18, plant: 3 },
  { left: "69%", delay: 4.1, duration: 16, size: 18, drift: 14, plant: 4 },
  { left: "92%", delay: 1.1, duration: 13, size: 20, drift: -10, plant: 5 },
]

function plantStyle(index: number, size: number): CSSProperties {
  const i = FLOAT_INDICES[index % FLOAT_INDICES.length]
  const col = i % PLANT_ATLAS.cols
  const row = Math.floor(i / PLANT_ATLAS.cols)
  const scale = size / PLANT_ATLAS.cell
  return {
    width: size,
    height: size,
    backgroundImage: `url(${PLANT_ATLAS.href})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${PLANT_ATLAS.width * scale}px ${PLANT_ATLAS.height * scale}px`,
    backgroundPosition: `-${col * size}px -${row * size}px`,
    imageRendering: "pixelated",
  }
}

export function PetalField() {
  const reduced = useReducedMotion()
  if (reduced) return null

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {PETALS.map((petal, index) => (
        <motion.span
          key={index}
          className="absolute block"
          style={{
            left: petal.left,
            ...plantStyle(petal.plant, petal.size),
          }}
          initial={{ y: "-10vh", x: 0, rotate: 0, opacity: 0 }}
          animate={{
            y: "110vh",
            x: [0, petal.drift, 0],
            rotate: [0, 80, 160],
            opacity: [0, 0.55, 0.55, 0],
          }}
          transition={{
            duration: petal.duration,
            delay: petal.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  )
}
