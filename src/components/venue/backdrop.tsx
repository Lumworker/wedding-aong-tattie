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

function StainedGlass({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const r = w / 2
  const d = `M${x} ${y + h} V${y + r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h} Z`
  return (
    <g>
      <path d={d} fill="#1A1428" />
      <path
        d={`M${x + 3} ${y + h - 3} V${y + r} A${r - 3} ${r - 3} 0 0 1 ${x + w - 3} ${y + r} V${y + h - 3} Z`}
        fill="#3A68C8"
      />
      <path d={`M${x + w / 2} ${y + 8} V${y + h - 4}`} stroke="#F2C15A" strokeWidth="2" />
      <path d={`M${x + 6} ${y + r + 8} H${x + w - 6}`} stroke="#F2C15A" strokeWidth="2" />
      <path
        d={`M${x + 8} ${y + r - 6} A${r - 10} ${r - 10} 0 0 1 ${x + w - 8} ${y + r - 6} V${y + r + 10} H${x + 8} Z`}
        fill="#C43A4A"
        opacity="0.85"
      />
      <rect x={x + 8} y={y + r + 16} width={(w - 16) / 2 - 2} height={h - r - 24} fill="#2E9A6A" opacity="0.8" />
      <rect x={x + w / 2 + 2} y={y + r + 16} width={(w - 16) / 2 - 2} height={h - r - 24} fill="#E8A040" opacity="0.75" />
      <image
        href="/assets/tiddybub/light/window-glow.png"
        x={x - 18}
        y={y - 10}
        width={w + 36}
        height={h + 40}
        opacity="0.55"
        style={{ mixBlendMode: "screen" }}
      />
    </g>
  )
}

function AltarFlowers({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} style={{ imageRendering: "pixelated" }}>
      <image href="/assets/tiddybub/flowers/flower_01.png" x="-18" y="-22" width="22" height="22" />
      <image href="/assets/tiddybub/flowers/flower_03.png" x="-4" y="-26" width="20" height="20" />
      <image href="/assets/tiddybub/flowers/flower_02.png" x="8" y="-20" width="18" height="18" />
    </g>
  )
}

export function SceneBackdrop() {
  return (
    <g>
      <defs>
        <linearGradient id="wd-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1B2744" />
          <stop offset="55%" stopColor="#3A2A48" />
          <stop offset="100%" stopColor="#5A3A3A" />
        </linearGradient>
        <linearGradient id="wd-nave" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2A2438" />
          <stop offset="100%" stopColor="#1A1524" />
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
        <linearGradient id="wd-shaft" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#FFE7B0" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#FFE7B0" stopOpacity="0" />
        </linearGradient>
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

      <path d="M8 156 L320 8 L632 156 L572 156 L320 58 L68 156 Z" fill="#4A2030" />
      <path d="M68 156 L320 58 L572 156 L520 156 L320 86 L120 156 Z" fill="#6A3044" />
      <path d="M320 0 V28" stroke="#E8C878" strokeWidth="4" strokeLinecap="round" />
      <path d="M304 14 H336" stroke="#E8C878" strokeWidth="4" strokeLinecap="round" />

      <g transform="translate(78 42)">
        <path d="M-8 90 L24 28 L56 90 Z" fill="#4A2030" />
        <rect x="6" y="88" width="36" height="78" fill="#3A3048" />
        <rect x="14" y="100" width="20" height="28" rx="10" fill="#120C1C" />
        <g transform="translate(24 116)">
          <g className="wd-bell">
            <rect x="-1.5" y="-12" width="3" height="12" fill="#E8C878" />
            <path d="M-8 0 L-10 16 Q0 24 10 16 L8 0 Z" fill="#F2C15A" />
          </g>
        </g>
      </g>

      <path d="M72 152 L10 208 L10 808 L72 768 Z" fill="#2A2236" />
      <path d="M568 152 L630 208 L630 808 L568 768 Z" fill="#241C30" />
      <rect x="72" y="152" width="496" height="628" fill="url(#wd-nave)" />

      <g transform="translate(320 124)" filter="url(#wd-bloom)">
        <circle r="40" fill="#3A2A28" />
        <circle r="30" fill="#C43A4A" opacity="0.9" />
        <circle r="18" fill="#F2C15A" opacity="0.85" />
        <circle r="8" fill="#FFF4D0" />
      </g>

      <StainedGlass x={108} y={176} w={78} h={128} />
      <StainedGlass x={230} y={176} w={78} h={128} />
      <StainedGlass x={332} y={176} w={78} h={128} />
      <StainedGlass x={454} y={176} w={78} h={128} />

      <image
        href="/assets/tiddybub/light/cone.png"
        x="70"
        y="250"
        width="220"
        height="520"
        opacity="0.28"
        style={{ mixBlendMode: "screen" }}
        className="wd-shaft"
      />
      <image
        href="/assets/tiddybub/light/cone.png"
        x="350"
        y="250"
        width="220"
        height="520"
        opacity="0.28"
        style={{ mixBlendMode: "screen" }}
        className="wd-shaft"
      />
      <image
        href="/assets/tiddybub/light/streaks.png"
        x="90"
        y="280"
        width="460"
        height="360"
        opacity="0.22"
        style={{ mixBlendMode: "screen" }}
      />

      {Array.from({ length: 14 }).map((_, index) => (
        <circle
          key={index}
          cx={96 + index * 34}
          cy={164}
          r="3.2"
          fill="#F2C15A"
          className="wd-glow"
          style={{ animationDelay: `${index * 0.14}s` }}
        />
      ))}

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
      <path d="M300 520 L338 780" stroke="#FFE7B0" strokeWidth="10" opacity="0.08" />

      {[86, 554].map((x) => (
        <g key={x}>
          <rect x={x} y="220" width="28" height="560" fill="#1C1628" />
          <rect x={x + 4} y="220" width="8" height="560" fill="#3A3048" />
          <rect x={x} y="360" width="28" height="14" fill="#4A3A28" />
          <rect x={x} y="520" width="28" height="14" fill="#4A3A28" />
        </g>
      ))}

      {Array.from({ length: PEW.rows }).map((_, index) => {
        const y = PEW.startY + index * PEW.rowGap
        return (
          <g key={index}>
            <rect x={PEW.leftX} y={y + 8} width={PEW.width} height="14" fill="#2A1C14" />
            <rect x={PEW.leftX} y={y + 4} width={PEW.width} height="9" fill="#5A3A28" />
            <rect x={PEW.rightX} y={y + 8} width={PEW.width} height="14" fill="#2A1C14" />
            <rect x={PEW.rightX} y={y + 4} width={PEW.width} height="9" fill="#5A3A28" />
            {index % 2 === 0 ? (
              <>
                <image
                  href="/assets/tiddybub/flowers/flower_04.png"
                  x={PEW.leftX - 4}
                  y={y - 6}
                  width="14"
                  height="14"
                  style={{ imageRendering: "pixelated" }}
                />
                <image
                  href="/assets/tiddybub/flowers/flower_04.png"
                  x={PEW.rightX + PEW.width - 10}
                  y={y - 6}
                  width="14"
                  height="14"
                  style={{ imageRendering: "pixelated" }}
                />
              </>
            ) : null}
          </g>
        )
      })}

      <ellipse cx="320" cy="456" rx="170" ry="90" fill="url(#wd-spot)" />
      <rect x="150" y="486" width="340" height="26" fill="#5A3A22" />
      <rect x="134" y="506" width="372" height="12" fill="#3E2818" />
      <rect x="118" y="516" width="404" height="10" fill="#2A1C12" />
      <rect x="176" y="392" width="288" height="96" fill="#4A3424" />
      <rect x="176" y="392" width="288" height="8" fill="#E8C878" opacity="0.35" />
      <path d="M176 488 H464" stroke="#E8C878" strokeWidth="2" opacity="0.7" />

      <g transform="translate(320 404)" filter="url(#wd-bloom)">
        <rect x="-56" y="-10" width="112" height="14" fill="#6A4A28" />
        <rect x="-48" y="-36" width="96" height="28" fill="#F4E4C4" />
        <rect x="-5" y="-70" width="10" height="36" fill="#E8C878" />
        <rect x="-16" y="-60" width="32" height="7" fill="#E8C878" />
      </g>
      <AltarFlowers x={196} y={488} />
      <AltarFlowers x={444} y={488} />
      <Candle x={232} y={428} />
      <Candle x={408} y={428} />
      <Candle x={248} y={436} />
      <Candle x={392} y={436} />

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
