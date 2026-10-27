function PixelBlob({
  x,
  y,
  cells,
  fill,
}: {
  x: number
  y: number
  cells: Array<[number, number, number, number]>
  fill: string
}) {
  return (
    <g transform={`translate(${x} ${y})`} shapeRendering="crispEdges">
      {cells.map(([cx, cy, w, h], index) => (
        <rect key={index} x={cx} y={cy} width={w} height={h} fill={fill} />
      ))}
    </g>
  )
}

function PixelCloud({ x, y, tint = "#FFFFFF" }: { x: number; y: number; tint?: string }) {
  return (
    <g className="wd-cloud" transform={`translate(${x} ${y})`}>
      <PixelBlob
        x={0}
        y={0}
        fill={tint}
        cells={[
          [12, 8, 52, 12],
          [4, 16, 72, 12],
          [16, 0, 40, 12],
          [24, -8, 22, 12],
        ]}
      />
    </g>
  )
}

function GrassTuft({ x, y, tall = false }: { x: number; y: number; tall?: boolean }) {
  const h = tall ? 14 : 9
  return (
    <g transform={`translate(${x} ${y})`} shapeRendering="crispEdges">
      <rect x="-2" y={-h} width="3" height={h} fill="#3FA84A" />
      <rect x="2" y={-h + 2} width="3" height={h - 2} fill="#5BC85A" />
      <rect x="-6" y={-h + 4} width="3" height={h - 4} fill="#2E8A3A" />
    </g>
  )
}

function ConcretePipe({
  x,
  y,
  scale = 1,
  facing = "left",
}: {
  x: number
  y: number
  scale?: number
  facing?: "left" | "right"
}) {
  const flip = facing === "right" ? -1 : 1
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * flip} ${scale})`}>
      <ellipse cx="54" cy="0" rx="18" ry="38" fill="#9A8460" />
      <rect x="-58" y="-38" width="112" height="76" fill="#CDB68A" />
      <rect x="-58" y="-38" width="112" height="10" fill="#E4D4B0" />
      <rect x="-58" y="28" width="112" height="10" fill="#A89068" />
      <rect x="-58" y="-18" width="112" height="6" fill="#DCCAA0" opacity="0.7" />
      <ellipse cx="-58" cy="0" rx="22" ry="38" fill="#6B5840" />
      <ellipse cx="-58" cy="0" rx="16" ry="30" fill="#1A1410" />
      <ellipse cx="-62" cy="-6" rx="6" ry="10" fill="#3A2C22" opacity="0.55" />
      <ellipse cx="54" cy="0" rx="10" ry="30" fill="#BBA478" />
    </g>
  )
}

function UprightPipe({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="48" rx="40" ry="14" fill="#8A7350" opacity="0.45" />
      <rect x="-36" y="-52" width="72" height="100" fill="#CDB68A" />
      <rect x="-36" y="-52" width="10" height="100" fill="#E4D4B0" />
      <rect x="26" y="-52" width="10" height="100" fill="#A89068" />
      <ellipse cx="0" cy="-52" rx="36" ry="16" fill="#6B5840" />
      <ellipse cx="0" cy="-52" rx="24" ry="10" fill="#1A1410" />
      <rect x="-28" y="-8" width="56" height="6" fill="#DCCAA0" opacity="0.55" />
    </g>
  )
}

export function SceneTree({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
  const canopy = 46 * size
  return (
    <g transform={`translate(${x} ${y})`} className="wd-sway">
      <rect x={-6 * size} y={-8 * size} width={12 * size} height={56 * size} fill="#6B4A2A" />
      <rect x={-4 * size} y={-8 * size} width={4 * size} height={56 * size} fill="#8A6238" />
      <circle cx={-18 * size} cy={-28 * size} r={canopy * 0.55} fill="#2E9A3A" />
      <circle cx={20 * size} cy={-24 * size} r={canopy * 0.5} fill="#3CB64A" />
      <circle cx={0} cy={-42 * size} r={canopy * 0.62} fill="#48C85A" />
      <circle cx={8 * size} cy={-30 * size} r={canopy * 0.38} fill="#7AE07A" />
      <circle cx={-10 * size} cy={-34 * size} r={8 * size} fill="#9AF08A" opacity="0.55" />
    </g>
  )
}

export function SceneBackdrop() {
  return (
    <g>
      <defs>
        <linearGradient id="wd-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4EB8F0" />
          <stop offset="55%" stopColor="#8AD8F8" />
          <stop offset="100%" stopColor="#C8F0A8" />
        </linearGradient>
        <linearGradient id="wd-lot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8D49A" />
          <stop offset="100%" stopColor="#C8B06A" />
        </linearGradient>
      </defs>

      <rect width="640" height="900" fill="url(#wd-sky)" />

      <g shapeRendering="crispEdges">
        <rect x="430" y="78" width="44" height="44" fill="#FFE45A" />
        <rect x="438" y="86" width="28" height="28" fill="#FFF3A0" />
      </g>

      <PixelCloud x={40} y={70} />
      <g style={{ animationDelay: "-8s" }}>
        <PixelCloud x={360} y={48} tint="#F4FCFF" />
      </g>
      <g style={{ animationDelay: "-14s" }}>
        <PixelCloud x={220} y={108} tint="#FFFFFF" />
      </g>

      <g transform="translate(80 150)" className="wd-bird">
        <path d="M-8 2 L0 -4 L8 2" fill="none" stroke="#2A4A6A" strokeWidth="2" strokeLinecap="square" />
      </g>
      <g transform="translate(180 128)" className="wd-bird" style={{ animationDelay: "-6s" }}>
        <path d="M-7 2 L0 -3 L7 2" fill="none" stroke="#2A4A6A" strokeWidth="2" strokeLinecap="square" />
      </g>

      <path d="M0 320 L90 280 L180 310 L280 250 L390 300 L500 240 L640 290 V380 H0 Z" fill="#7BC85A" />
      <path d="M0 360 L140 330 L260 350 L400 310 L640 340 V420 H0 Z" fill="#5AAA48" />

      <rect x="0" y="400" width="640" height="500" fill="url(#wd-lot)" />
      <g shapeRendering="crispEdges" opacity="0.35">
        {Array.from({ length: 18 }).map((_, row) =>
          Array.from({ length: 20 }).map((__, col) =>
            (row + col) % 3 === 0 ? (
              <rect
                key={`${row}-${col}`}
                x={col * 32}
                y={410 + row * 26}
                width="16"
                height="8"
                fill={row % 2 === 0 ? "#D4C07A" : "#B89A58"}
              />
            ) : null
          )
        )}
      </g>

      <path d="M0 430 C120 410 220 450 320 428 C430 404 530 448 640 420 V470 H0 Z" fill="#6EBB4A" />
      <path d="M0 780 C80 760 160 800 280 770 C400 740 520 790 640 760 V900 H0 Z" fill="#4A9A3A" />

      {[40, 90, 160, 230, 310, 390, 470, 540, 600].map((x, i) => (
        <GrassTuft key={x} x={x} y={448 + (i % 3) * 8} tall={i % 2 === 0} />
      ))}
      {[70, 150, 250, 360, 480, 560].map((x, i) => (
        <GrassTuft key={`m-${x}`} x={x} y={620 + (i % 2) * 14} />
      ))}
      {[30, 110, 200, 300, 420, 510, 590].map((x, i) => (
        <GrassTuft key={`f-${x}`} x={x} y={840 + (i % 3) * 10} tall />
      ))}

      <SceneTree x={72} y={448} size={1.05} />
      <SceneTree x={128} y={392} size={0.86} />
      <SceneTree x={48} y={540} size={0.92} />
      <SceneTree x={200} y={368} size={0.72} />
      <SceneTree x={440} y={360} size={0.7} />
      <SceneTree x={520} y={384} size={0.88} />
      <SceneTree x={580} y={440} size={1.02} />
      <SceneTree x={598} y={536} size={0.9} />

      <UprightPipe x={168} y={528} scale={0.78} />
      <ConcretePipe x={150} y={668} scale={0.92} facing="right" />
      <ConcretePipe x={490} y={548} scale={0.72} facing="left" />
      <ConcretePipe x={520} y={708} scale={1} facing="left" />
      <UprightPipe x={318} y={760} scale={0.55} />

      <g transform="translate(318 508)">
        <rect x="-54" y="-10" width="108" height="20" rx="10" fill="#FFF8E8" stroke="#E07070" strokeWidth="2" />
        <text y="1" textAnchor="middle" dominantBaseline="central" fill="#E07070" fontSize="11" fontFamily="ui-sans-serif, sans-serif">
          ยินดีต้อนรับ
        </text>
      </g>
    </g>
  )
}

export function SceneForeground() {
  return (
    <g>
      <SceneTree x={36} y={820} size={0.95} />
      <SceneTree x={604} y={816} size={0.92} />
      <g className="wd-sway" style={{ transformOrigin: "80px 900px" }}>
        <ellipse cx="70" cy="892" rx="50" ry="14" fill="#2E8A3A" />
        <ellipse cx="110" cy="898" rx="34" ry="10" fill="#3FA84A" />
      </g>
      <g className="wd-sway" style={{ animationDelay: "-2s", transformOrigin: "560px 900px" }}>
        <ellipse cx="570" cy="894" rx="48" ry="14" fill="#3CB64A" />
        <ellipse cx="530" cy="898" rx="32" ry="10" fill="#2E8A3A" />
      </g>
      <GrassTuft x={24} y={888} tall />
      <GrassTuft x={148} y={896} />
      <GrassTuft x={500} y={894} tall />
      <GrassTuft x={620} y={888} />
    </g>
  )
}
