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
        d={`M${x + 4} ${y + h - 4} V${y + r} A${r - 4} ${r - 4} 0 0 1 ${x + w - 4} ${y + r} V${y + h - 4} Z`}
        fill="#F8E2B8"
        className="wd-glow"
      />
      <path d={`M${x + w / 2} ${y + 6} V${y + h - 4}`} stroke="#E7C4C4" strokeWidth="1.4" opacity="0.7" />
      <path d={`M${x + 6} ${y + r + 6} H${x + w - 6}`} stroke="#8FA08A" strokeWidth="1.4" opacity="0.65" />
    </g>
  )
}

export function SceneBackdrop() {
  return (
    <g>
      <defs>
        <linearGradient id="wd-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F8D5CC" />
          <stop offset="70%" stopColor="#F7E6DA" />
          <stop offset="100%" stopColor="#E4EFE3" />
        </linearGradient>
        <radialGradient id="wd-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFE7C4" stopOpacity="0.95" />
          <stop offset="48%" stopColor="#F6C9B4" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#F6C9B4" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="640" height="900" fill="url(#wd-sky)" />
      <circle cx="520" cy="70" r="90" fill="url(#wd-sun)" />

      <g transform="translate(70 36)">
        <g className="wd-cloud">
          <ellipse cx="0" cy="0" rx="36" ry="14" fill="#fff" opacity="0.78" />
          <ellipse cx="-22" cy="5" rx="18" ry="10" fill="#fff" opacity="0.78" />
          <ellipse cx="24" cy="6" rx="20" ry="11" fill="#fff" opacity="0.78" />
        </g>
      </g>

      {/* Roof */}
      <path d="M18 168 L320 18 L622 168 L560 168 L320 72 L80 168 Z" fill="#C17B73" />
      <path d="M80 168 L320 72 L560 168 L510 168 L320 102 L130 168 Z" fill="#D08A82" opacity="0.55" />
      <path d="M320 4 V32" stroke="#D4B06A" strokeWidth="4" strokeLinecap="round" />
      <path d="M306 16 H334" stroke="#D4B06A" strokeWidth="4" strokeLinecap="round" />

      {/* Bell tower */}
      <g transform="translate(86 52)">
        <path d="M-6 86 L22 36 L50 86 Z" fill="#C17B73" />
        <rect x="4" y="84" width="36" height="92" fill="#F4EADF" />
        <rect x="12" y="98" width="20" height="30" rx="10" fill="#6A4E3C" />
        <g transform="translate(22 116)">
          <g className="wd-bell">
            <rect x="-1.5" y="-12" width="3" height="12" fill="#A68545" />
            <path d="M-8 0 L-10 16 Q0 24 10 16 L8 0 Z" fill="#D4B06A" />
            <circle cx="0" cy="18" r="2.2" fill="#8A6A32" />
          </g>
        </g>
      </g>

      {/* Side walls */}
      <path d="M86 164 L18 214 L18 812 L86 772 Z" fill="#E7D5C4" />
      <path d="M554 164 L622 214 L622 812 L554 772 Z" fill="#E4D0BE" />

      {/* Nave */}
      <rect x="86" y="164" width="468" height="616" fill="#F7F1E8" />
      <g transform="translate(320 132)">
        <circle r="38" fill="#E7D3C4" />
        <circle r="29" fill="#F8E7DC" />
        {Array.from({ length: 8 }).map((_, index) => (
          <ellipse
            key={index}
            cx="0"
            cy="-14"
            rx="4.4"
            ry="10"
            fill={index % 2 === 0 ? "#E7C4C4" : "#8FA08A"}
            opacity="0.9"
            transform={`rotate(${index * 45})`}
          />
        ))}
        <circle r="5" fill="#D4B06A" />
      </g>

      <ArchWindow x={128} y={188} w={70} h={118} />
      <ArchWindow x={246} y={188} w={70} h={118} />
      <ArchWindow x={324} y={188} w={70} h={118} />
      <ArchWindow x={442} y={188} w={70} h={118} />

      {Array.from({ length: 16 }).map((_, index) => (
        <circle
          key={index}
          cx={92 + index * 29}
          cy={172 + Math.sin(index * 0.7) * 3}
          r="3"
          fill="#F8E2B8"
          className="wd-glow"
          style={{ animationDelay: `${index * 0.16}s` }}
        />
      ))}

      {/* Nave floor */}
      <rect x="78" y="512" width="484" height="268" fill="#E4C8A4" />
      {Array.from({ length: 12 }).map((_, index) => (
        <line
          key={index}
          x1="96"
          x2="544"
          y1={524 + index * 20}
          y2={524 + index * 20}
          stroke="#D3B48A"
          strokeWidth="1"
        />
      ))}
      <rect x="286" y="512" width="68" height="268" fill="#E7C4C4" opacity="0.38" />
      <rect x="286" y="512" width="2" height="268" fill="#F7F1EA" opacity="0.75" />
      <rect x="352" y="512" width="2" height="268" fill="#F7F1EA" opacity="0.75" />
      <polygon points="128,306 198,306 250,780 78,780" fill="#F8E2B8" opacity="0.14" />
      <polygon points="442,306 512,306 562,780 390,780" fill="#F8E2B8" opacity="0.11" />

      {[0, 1, 2, 3, 4].map((index) => (
        <g key={index}>
          <rect x="102" y={536 + index * 42} width="168" height="14" rx="3" fill="#7A5642" />
          <rect x="370" y={536 + index * 42} width="168" height="14" rx="3" fill="#7A5642" />
        </g>
      ))}

      {/* Sanctuary platform — couple only */}
      <rect x="148" y="488" width="344" height="28" fill="#D9B48A" />
      <rect x="132" y="508" width="376" height="12" fill="#C9A072" />
      <rect x="116" y="518" width="408" height="10" fill="#B89064" />
      <rect x="168" y="398" width="304" height="92" fill="#EFE3D4" />
      <rect x="168" y="398" width="304" height="8" fill="#F7F1EA" />
      <path d="M168 490 H472" stroke="#A68545" strokeWidth="3" />
      <ellipse cx="320" cy="458" rx="118" ry="16" fill="#F8E2B8" opacity="0.28" className="wd-glow" />

      {/* Altar behind the couple */}
      <g transform="translate(320 412)">
        <rect x="-52" y="-8" width="104" height="12" rx="2" fill="#E7D5C4" />
        <rect x="-44" y="-32" width="88" height="26" rx="3" fill="#FFFCF8" />
        <rect x="-4" y="-62" width="8" height="32" rx="1" fill="#D4B06A" />
        <rect x="-14" y="-54" width="28" height="6" rx="1" fill="#D4B06A" />
        <Flower x={-36} y={-36} color="#E7C4C4" r={3.6} />
        <Flower x={36} y={-34} color="#FFFCF8" r={3.4} />
        <Flower x={-22} y={-44} color="#F7F1EA" r={2.6} />
        <Flower x={22} y={-44} color="#E7B4B8" r={2.6} />
      </g>

      {/* Door threshold, tiny yard */}
      <rect x="96" y="780" width="448" height="22" fill="#EFE3D4" />
      <rect x="64" y="800" width="512" height="18" fill="#E6D5C2" />
      <rect x="0" y="816" width="640" height="84" fill="#C5D8C2" />
      <path d="M292 818 L348 818 L372 900 L268 900 Z" fill="#EFE3D2" />
      <Flower x={118} y={838} color="#E7C4C4" />
      <Flower x={522} y={838} color="#FFFCF8" r={2.8} />
    </g>
  )
}

export function SceneForeground() {
  return (
    <g>
      <ellipse cx="36" cy="888" rx="34" ry="12" fill="#7E9A78" />
      <ellipse cx="604" cy="888" rx="34" ry="12" fill="#8FA98A" />
    </g>
  )
}
