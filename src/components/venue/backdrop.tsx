import { ALTAR_FLOWERS, FlowerSprite, PEW_FLOWERS, PlantSprite, TuftSprite } from "@/components/venue/plant"
import { TREES } from "@/lib/plant-atlas"
import { PEW } from "@/lib/scene-layout"

function Candle({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-3" y="0" width="6" height="14" fill="#F4E4C4" />
      <rect x="-2" y="2" width="2" height="10" fill="#FFF8E8" />
      <ellipse cx="0" cy="-4" rx="3" ry="5" fill="#FFE08A" className="wd-glow" />
      <ellipse cx="0" cy="-6" rx="8" ry="10" fill="#FFC45A" opacity="0.22" className="wd-glow" />
    </g>
  )
}

function Pixel({
  href,
  x,
  y,
  width,
  height,
  opacity,
  blend,
  className,
}: {
  href: string
  x: number
  y: number
  width: number
  height: number
  opacity?: number
  blend?: "screen"
  className?: string
}) {
  return (
    <image
      href={href}
      x={x}
      y={y}
      width={width}
      height={height}
      opacity={opacity}
      className={className}
      style={{ imageRendering: "pixelated", mixBlendMode: blend }}
    />
  )
}

function treeByName(name: string) {
  const tree = TREES.find((item) => item.name === name)
  if (!tree) throw new Error(`missing tree ${name}`)
  return tree
}

function AltarFlowers({ x, y, seed }: { x: number; y: number; seed: number }) {
  return (
    <g>
      <FlowerSprite index={ALTAR_FLOWERS[seed % ALTAR_FLOWERS.length]} x={x - 16} y={y} />
      <FlowerSprite index={ALTAR_FLOWERS[(seed + 1) % ALTAR_FLOWERS.length]} x={x} y={y + 2} pixel={2} />
      <FlowerSprite index={ALTAR_FLOWERS[(seed + 2) % ALTAR_FLOWERS.length]} x={x + 18} y={y} />
    </g>
  )
}

export function SceneBackdrop() {
  const churchW = 300
  const churchH = 450
  const churchX = (640 - churchW) / 2
  const churchY = 28

  return (
    <g>
      <defs>
        <linearGradient id="wd-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1B2744" />
          <stop offset="55%" stopColor="#3A2A48" />
          <stop offset="100%" stopColor="#5A3A3A" />
        </linearGradient>
        <linearGradient id="wd-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6A4A32" />
          <stop offset="100%" stopColor="#3E2A1C" />
        </linearGradient>
        <radialGradient id="wd-spot" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#FFE6A8" stopOpacity="0.55" />
          <stop offset="42%" stopColor="#E8A050" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#E8A050" stopOpacity="0" />
        </radialGradient>
        <filter id="wd-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="wd-bloom" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="640" height="900" fill="url(#wd-sky)" />
      <circle cx="520" cy="64" r="70" fill="#F4C878" opacity="0.35" filter="url(#wd-soft)" />

      <Pixel href="/sprites/church.png" x={churchX} y={churchY} width={churchW} height={churchH} />
      <PlantSprite frame={treeByName("oak")} x={28} y={536} delay={0.1} sway />
      <PlantSprite frame={treeByName("pine")} x={132} y={470} delay={0.4} sway />
      <PlantSprite frame={treeByName("maple")} x={456} y={508} delay={0.6} sway />
      <PlantSprite frame={treeByName("birch")} x={498} y={518} delay={0.8} sway />
      <PlantSprite frame={treeByName("willow")} x={548} y={552} delay={1.2} sway />
      <Pixel href="/assets/tiddybub/light/window-glow.png" x={churchX + 40} y={churchY + 80} width={churchW - 80} height={180} opacity={0.5} blend="screen" />
      <Pixel href="/assets/tiddybub/light/cone.png" x={70} y={250} width={220} height={520} opacity={0.28} blend="screen" className="wd-shaft" />
      <Pixel href="/assets/tiddybub/light/cone.png" x={350} y={250} width={220} height={520} opacity={0.28} blend="screen" className="wd-shaft" />
      <Pixel href="/assets/tiddybub/light/streaks.png" x={90} y={200} width={460} height={320} opacity={0.2} blend="screen" />

      <rect x="70" y="508" width="500" height="276" fill="url(#wd-floor)" />
      {Array.from({ length: 10 }).map((_, index) => (
        <path
          key={index}
          d={`M90 ${522 + index * 24} H550`}
          stroke="#8A6244"
          strokeWidth="1"
          opacity="0.35"
        />
      ))}
      <rect x="292" y="508" width="56" height="276" fill="#C48984" opacity="0.22" />
      <rect x="292" y="508" width="2" height="276" fill="#F8E2B8" opacity="0.35" />
      <rect x="346" y="508" width="2" height="276" fill="#F8E2B8" opacity="0.35" />

      {Array.from({ length: PEW.rows }).map((_, index) => {
        const y = PEW.startY + index * PEW.rowGap
        return (
          <g key={index}>
            <rect x={PEW.leftX} y={y + 8} width={PEW.width} height="14" fill="#2A1C14" />
            <rect x={PEW.leftX} y={y + 4} width={PEW.width} height="9" fill="#5A3A28" />
            <rect x={PEW.rightX} y={y + 8} width={PEW.width} height="14" fill="#2A1C14" />
            <rect x={PEW.rightX} y={y + 4} width={PEW.width} height="9" fill="#5A3A28" />
            <FlowerSprite index={PEW_FLOWERS[index % PEW_FLOWERS.length]} x={PEW.leftX - 4} y={y + 14} />
            <FlowerSprite index={PEW_FLOWERS[(index + 3) % PEW_FLOWERS.length]} x={PEW.rightX + PEW.width - 8} y={y + 14} />
          </g>
        )
      })}

      <ellipse cx="320" cy="456" rx="170" ry="90" fill="url(#wd-spot)" />
      <rect x="150" y="486" width="340" height="26" fill="#5A3A22" />
      <rect x="134" y="506" width="372" height="12" fill="#3E2818" />
      <rect x="118" y="516" width="404" height="10" fill="#2A1C12" />

      <TuftSprite index={0} x={28} y={514} />
      <TuftSprite index={1} x={70} y={516} />
      <TuftSprite index={2} x={548} y={504} />
      <TuftSprite index={3} x={600} y={538} />

      <AltarFlowers x={214} y={500} seed={0} />
      <AltarFlowers x={426} y={500} seed={2} />
      <FlowerSprite index={12} x={168} y={512} />
      <FlowerSprite index={13} x={452} y={512} />
      <g filter="url(#wd-bloom)">
        <Candle x={248} y={468} />
        <Candle x={392} y={468} />
      </g>

      <rect x="88" y="784" width="464" height="20" fill="#3A2A20" />
      <rect x="56" y="802" width="528" height="16" fill="#2A1E18" />
      <rect x="0" y="816" width="640" height="84" fill="#121018" />
      <path d="M292 818 L348 818 L368 900 L272 900 Z" fill="#2A2418" />
    </g>
  )
}

export function SceneForeground() {
  return (
    <g>
      <rect x="0" y="0" width="640" height="900" fill="none" stroke="#0A0810" strokeWidth="18" opacity="0.35" />
    </g>
  )
}
