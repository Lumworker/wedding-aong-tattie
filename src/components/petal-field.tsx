"use client"

import { motion, useReducedMotion } from "framer-motion"

const PETALS = [
  { left: "6%", delay: 0, duration: 13, size: 9, color: "#E7C4C4", drift: 18 },
  { left: "16%", delay: 1.4, duration: 15, size: 7, color: "#F3D5CE", drift: -14 },
  { left: "28%", delay: 0.6, duration: 12, size: 11, color: "#E7C4C4", drift: 10 },
  { left: "39%", delay: 2.2, duration: 16, size: 8, color: "#F7E1D4", drift: -20 },
  { left: "51%", delay: 0.2, duration: 14, size: 10, color: "#D7E3D6", drift: 16 },
  { left: "63%", delay: 1.8, duration: 13, size: 7, color: "#E7C4C4", drift: -12 },
  { left: "74%", delay: 0.9, duration: 17, size: 12, color: "#F0D0CC", drift: 22 },
  { left: "86%", delay: 2.6, duration: 12.5, size: 8, color: "#E7C4C4", drift: -16 },
  { left: "12%", delay: 3.1, duration: 15, size: 6, color: "#F6E7C2", drift: 12 },
  { left: "47%", delay: 3.6, duration: 14, size: 9, color: "#E7C4C4", drift: -18 },
  { left: "69%", delay: 4.1, duration: 16, size: 7, color: "#F3D5CE", drift: 14 },
  { left: "92%", delay: 1.1, duration: 13, size: 8, color: "#D7E3D6", drift: -10 },
]

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
            width: petal.size,
            height: petal.size * 1.35,
            background: petal.color,
            borderRadius: "70% 30% 70% 30%",
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
