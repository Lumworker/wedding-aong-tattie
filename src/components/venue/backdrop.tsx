function Flower({ x, y, color, r = 3.2 }: { x: number; y: number; color: string; r?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx="-2.2" cy="0" r={r * 0.7} fill={color} />
      <circle cx="2.2" cy="0" r={r * 0.7} fill={color} />
      <circle cx="0" cy="-2" r={r * 0.7} fill={color} />
      <circle cx="0" cy="2" r={r * 0.7} fill={color} />
      <circle cx="0" cy="0" r={r * 0.38} fill="#F6E7C2" />
    </g>
  )
}

function ArchWindow({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const r = w / 2
  const d = `M${x} ${y + h} V${y + r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h} Z`
  return (
    <g>
      <path d={d} fill="#6A4E3C" />
      <path
        d={`M${x + 3} ${y + h - 3} V${y + r} A${r - 3} ${r - 3} 0 0 1 ${x + w - 3} ${y + r} V${y + h - 3} Z`}
        fill="#F8E2B8"
        className="wd-glow"
      />
      <path d={`M${x + w / 2} ${y + 4} V${y + h - 3}`} stroke="#E7C4C4" strokeWidth="1.2" opacity="0.7" />
      <path d={`M${x + 4} ${y + r + 4} H${x + w - 4}`} stroke="#8FA08A" strokeWidth="1.2" opacity="0.65" />
    </g>
  )
}

function Tree({ x, y, blossom = false }: { x: number; y: number; blossom?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="wd-sway">
        <rect x="-6" y="-10" width="12" height="54" rx="4" fill="#6E5344" />
        <ellipse cx="-16" cy="-28" rx="24" ry="20" fill="#7E9A78" />
        <ellipse cx="16" cy="-24" rx="22" ry="18" fill="#8FA98A" />
        <ellipse cx="0" cy="-46" rx="26" ry="22" fill="#6E8F6C" />
        <ellipse cx="0" cy="-30" rx="18" ry="14" fill="#A3C09A" opacity="0.65" />
        {blossom ? (
          <>
            <circle cx="-12" cy="-40" r="3" fill="#F0C9C6" />
            <circle cx="8" cy="-50" r="2.6" fill="#E7C4C4" />
            <circle cx="14" cy="-30" r="2.4" fill="#FFFCF8" />
            <circle cx="-4" cy="-24" r="2.2" fill="#E7B4B8" />
          </>
        ) : null}
      </g>
    </g>
  )
}

export function SceneBackdrop() {
  return (
    <g>
      <defs>
        <linearGradient id="wd-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F8D5CC" />
          <stop offset="46%" stopColor="#F7E6DA" />
          <stop offset="100%" stopColor="#E4EFE3" />
        </linearGradient>
        <radialGradient id="wd-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFE7C4" stopOpacity="0.95" />
          <stop offset="48%" stopColor="#F6C9B4" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#F6C9B4" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="wd-lawn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D5E6D2" />
          <stop offset="100%" stopColor="#C5D8C2" />
        </linearGradient>
      </defs>

      <rect width="640" height="900" fill="url(#wd-sky)" />
      <circle cx="470" cy="168" r="130" fill="url(#wd-sun)" />

      <g transform="translate(120 92)">
        <g className="wd-cloud">
          <ellipse cx="0" cy="0" rx="40" ry="16" fill="#fff" opacity="0.8" />
          <ellipse cx="-26" cy="6" rx="22" ry="12" fill="#fff" opacity="0.8" />
          <ellipse cx="28" cy="7" rx="26" ry="13" fill="#fff" opacity="0.8" />
        </g>
      </g>
      <g transform="translate(430 70)">
        <g className="wd-cloud" style={{ animationDelay: "-6s", animationDuration: "26s" }}>
          <ellipse cx="0" cy="0" rx="32" ry="13" fill="#fff" opacity="0.72" />
          <ellipse cx="-20" cy="5" rx="16" ry="10" fill="#fff" opacity="0.72" />
          <ellipse cx="22" cy="6" rx="18" ry="10" fill="#fff" opacity="0.72" />
        </g>
      </g>

      <g transform="translate(90 128)" className="wd-bird">
        <path d="M-8 2 L0 -3 L8 2" fill="none" stroke="#8F5E58" strokeWidth="1.4" strokeLinecap="round" />
      </g>
      <g transform="translate(150 108)" className="wd-bird" style={{ animationDelay: "-7s" }}>
        <path d="M-7 2 L0 -2 L7 2" fill="none" stroke="#5E564F" strokeWidth="1.3" strokeLinecap="round" />
      </g>

      <path d="M0 500 C140 450 250 490 340 470 C450 446 540 490 640 460 V560 H0 Z" fill="#D7E7D4" />
      <path d="M0 545 C180 510 320 560 460 530 C540 514 600 540 640 528 V640 H0 Z" fill="#C9DCC6" />

      <rect x="0" y="590" width="640" height="310" fill="url(#wd-lawn)" />
      <path d="M292 648 L348 648 L392 900 L248 900 Z" fill="#EFE3D2" />
      <path d="M308 648 L332 648 L348 900 L292 900 Z" fill="#E7D7C2" opacity="0.65" />

      <Tree x={78} y={560} blossom />
      <Tree x={560} y={548} />

      {/* Bell tower */}
      <g transform="translate(168 176)">
        <path d="M-4 78 L17 36 L38 78 Z" fill="#C17B73" />
        <rect x="2" y="76" width="30" height="150" fill="#F4EADF" />
        <rect x="8" y="96" width="18" height="26" rx="8" fill="#6A4E3C" />
        <g transform="translate(17 112)">
          <g className="wd-bell">
            <rect x="-1" y="-10" width="2" height="10" fill="#A68545" />
            <path d="M-7 0 L-9 14 Q0 20 9 14 L7 0 Z" fill="#D4B06A" />
            <circle cx="0" cy="16" r="2" fill="#8A6A32" />
          </g>
        </g>
      </g>

      {/* Roof */}
      <path d="M118 318 L320 132 L522 318 L470 318 L320 196 L170 318 Z" fill="#C17B73" />
      <path d="M170 318 L320 196 L470 318 L430 318 L320 230 L210 318 Z" fill="#D08A82" opacity="0.55" />
      <path d="M320 108 V138" stroke="#D4B06A" strokeWidth="3" strokeLinecap="round" />
      <path d="M310 118 H330" stroke="#D4B06A" strokeWidth="3" strokeLinecap="round" />

      {/* Side walls */}
      <path d="M196 312 L150 348 L150 608 L196 578 Z" fill="#E7D5C4" />
      <path d="M444 312 L490 348 L490 608 L444 578 Z" fill="#E4D0BE" />

      {/* Nave */}
      <rect x="196" y="312" width="248" height="300" fill="#F7F1E8" />
      <g transform="translate(320 236)">
        <circle r="30" fill="#E7D3C4" />
        <circle r="23" fill="#F8E7DC" />
        {Array.from({ length: 8 }).map((_, index) => (
          <ellipse
            key={index}
            cx="0"
            cy="-12"
            rx="3.6"
            ry="8"
            fill={index % 2 === 0 ? "#E7C4C4" : "#8FA08A"}
            opacity="0.9"
            transform={`rotate(${index * 45})`}
          />
        ))}
        <circle r="4" fill="#D4B06A" />
      </g>

      <ArchWindow x={230} y={332} w={46} h={78} />
      <ArchWindow x={364} y={332} w={46} h={78} />

      {Array.from({ length: 12 }).map((_, index) => (
        <circle
          key={index}
          cx={168 + index * 28}
          cy={326 + Math.sin(index * 0.7) * 3}
          r="2.6"
          fill="#F8E2B8"
          className="wd-glow"
          style={{ animationDelay: `${index * 0.18}s` }}
        />
      ))}

      {/* Floor, window light, and pews */}
      <rect x="186" y="500" width="268" height="116" rx="6" fill="#E4C8A4" />
      {Array.from({ length: 8 }).map((_, index) => (
        <line
          key={index}
          x1="196"
          x2="444"
          y1={508 + index * 13}
          y2={508 + index * 13}
          stroke="#D3B48A"
          strokeWidth="1"
        />
      ))}
      <polygon points="253,410 276,410 318,616 228,616" fill="#F8E2B8" opacity="0.16" />
      <polygon points="364,410 387,410 430,616 340,616" fill="#F8E2B8" opacity="0.12" />
      <rect x="288" y="500" width="64" height="116" fill="#E7C4C4" opacity="0.42" />
      <rect x="288" y="500" width="2" height="116" fill="#F7F1EA" opacity="0.7" />
      <rect x="350" y="500" width="2" height="116" fill="#F7F1EA" opacity="0.7" />
      <ellipse cx="320" cy="562" rx="88" ry="18" fill="#F8E2B8" opacity="0.22" className="wd-glow" />

      {[0, 1, 2].map((index) => (
        <g key={index}>
          <rect x="206" y={508 + index * 24} width="74" height="11" rx="3" fill="#7A5642" />
          <rect x="360" y={508 + index * 24} width="74" height="11" rx="3" fill="#7A5642" />
        </g>
      ))}

      {/* Altar */}
      <g transform="translate(320 492)">
        <rect x="-40" y="-6" width="80" height="10" rx="2" fill="#E7D5C4" />
        <rect x="-34" y="-26" width="68" height="22" rx="3" fill="#FFFCF8" />
        <rect x="-3" y="-52" width="6" height="26" rx="1" fill="#D4B06A" />
        <rect x="-10" y="-46" width="20" height="5" rx="1" fill="#D4B06A" />
        <Flower x={-28} y={-30} color="#E7C4C4" r={3.4} />
        <Flower x={28} y={-28} color="#FFFCF8" r={3.2} />
        <Flower x={-18} y={-36} color="#F7F1EA" r={2.4} />
        <Flower x={18} y={-36} color="#E7B4B8" r={2.4} />
      </g>

      {/* Steps */}
      <rect x="214" y="616" width="212" height="14" rx="2" fill="#EFE3D4" />
      <rect x="192" y="630" width="256" height="14" rx="2" fill="#E6D5C2" />
      <rect x="170" y="644" width="300" height="16" rx="3" fill="#DCC9B2" />

      <Flower x={168} y={668} color="#E7C4C4" />
      <Flower x={188} y={676} color="#FFFCF8" r={2.6} />
      <Flower x={452} y={668} color="#E7C4C4" />
      <Flower x={474} y={678} color="#F7F1EA" r={2.6} />
    </g>
  )
}

export function SceneForeground() {
  return (
    <g>
      <g className="wd-sway" style={{ transformOrigin: "80px 900px" }}>
        <ellipse cx="46" cy="886" rx="42" ry="16" fill="#7E9A78" />
        <ellipse cx="78" cy="894" rx="28" ry="12" fill="#6E8F6C" />
      </g>
      <g className="wd-sway" style={{ animationDelay: "-2s", transformOrigin: "560px 900px" }}>
        <ellipse cx="600" cy="888" rx="40" ry="16" fill="#8FA98A" />
        <ellipse cx="566" cy="896" rx="26" ry="12" fill="#6E8F6C" />
      </g>
      <Flower x={36} y={868} color="#E7C4C4" r={3} />
      <Flower x={108} y={888} color="#FFFCF8" r={2.8} />
      <Flower x={534} y={886} color="#E7C4C4" r={3} />
      <Flower x={602} y={868} color="#F7F1EA" r={2.6} />
    </g>
  )
}
