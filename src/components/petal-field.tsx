"use client"

import { motion, useReducedMotion } from "framer-motion"

const FLOWERS = [
  "/assets/tiddybub/flowers/flower_01.png",
  "/assets/tiddybub/flowers/flower_02.png",
  "/assets/tiddybub/flowers/flower_03.png",
  "/assets/tiddybub/flowers/flower_04.png",
] as const

const PETALS = [
  { left: "6%", delay: 0, duration: 13, size: 18, drift: 18 },
  { left: "16%", delay: 1.4, duration: 15, size: 14, drift: -14 },
  { left: "28%", delay: 0.6, duration: 12, size: 20, drift: 10 },
  { left: "39%", delay: 2.2, duration: 16, size: 15, drift: -20 },
  { left: "51%", delay: 0.2, duration: 14, size: 18, drift: 16 },
  { left: "63%", delay: 1.8, duration: 13, size: 14, drift: -12 },
  { left: "74%", delay: 0.9, duration: 17, size: 22, drift: 22 },
  { left: "86%", delay: 2.6, duration: 12.5, size: 16, drift: -16 },
  { left: "12%", delay: 3.1, duration: 15, size: 13, drift: 12 },
  { left: "47%", delay: 3.6, duration: 14, size: 17, drift: -18 },
  { left: "69%", delay: 4.1, duration: 16, size: 15, drift: 14 },
  { left: "92%", delay: 1.1, duration: 13, size: 16, drift: -10 },
]

export function PetalField() {
  const reduced = useReducedMotion()
  if (reduced) return null

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {PETALS.map((petal, index) => (
        <motion.img
          key={index}
          src={FLOWERS[index % FLOWERS.length]}
          alt=""
          className="absolute block"
          style={{
            left: petal.left,
            width: petal.size,
            height: petal.size,
            imageRendering: "pixelated",
          }}
          initial={{ y: "-10vh", x: 0, rotate: 0, opacity: 0 }}
          animate={{
            y: "110vh",
            x: [0, petal.drift, 0],
            rotate: [0, 140, 280],
            opacity: [0, 0.75, 0.75, 0],
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
