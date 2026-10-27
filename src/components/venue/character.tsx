import { lookForGuest } from "@/lib/appearance"
import type { Guest } from "@/lib/types"

export type FigureRole = "guest" | "groom" | "bride"
export type FigureMood = "idle" | "walk" | "cheer"

function Nameplate({ label, y, highlight }: { label: string; y: number; highlight: boolean }) {
  const glyphs = Array.from(label)
  const shown = glyphs.length > 14 ? `${glyphs.slice(0, 13).join("")}…` : label
  const width = Math.max(36, Array.from(shown).length * 6.6 + 12)
  return (
    <g transform={`translate(0 ${y})`}>
      <rect x={-width / 2 + 1} y={-7} width={width} height={15} fill="#3A2C28" opacity="0.18" />
      <rect
        x={-width / 2}
        y={-8}
        width={width}
        height={15}
        fill={highlight ? "#3F5344" : "#FFFCF8"}
        stroke={highlight ? "#B8956A" : "#D9C6B2"}
        strokeWidth="1"
      />
      <text y="0.5" textAnchor="middle" dominantBaseline="central" fill={highlight ? "#F6F1EA" : "#2A2623"} fontSize="9">
        {shown}
      </text>
    </g>
  )
}

function PixelGroom({ label, highlight, showName }: { label: string; highlight: boolean; showName: boolean }) {
  return (
    <g>
      {label ? <title>{label}</title> : null}
      <ellipse cx="0" cy="4" rx="15" ry="3.4" fill="#2A2623" opacity="0.2" />
      {highlight ? (
        <ellipse cx="0" cy="-40" rx="24" ry="42" fill="none" stroke="#B8956A" strokeWidth="1.3" className="wd-ring" />
      ) : null}
      <g className="is-idle">
        <g className="wd-bob">
          <image
            href="/sprites/groom.png"
            x="-23"
            y="-82"
            width="46"
            height="82"
            style={{ imageRendering: "pixelated" }}
          />
        </g>
      </g>
      {showName && label ? <Nameplate label={label} y={-90} highlight /> : null}
    </g>
  )
}

function PixelBride({ label, highlight, showName }: { label: string; highlight: boolean; showName: boolean }) {
  return (
    <g>
      {label ? <title>{label}</title> : null}
      <ellipse cx="0" cy="4" rx="15" ry="3.4" fill="#2A2623" opacity="0.2" />
      {highlight ? (
        <ellipse cx="0" cy="-40" rx="24" ry="42" fill="none" stroke="#B8956A" strokeWidth="1.3" className="wd-ring" />
      ) : null}
      <g className="is-idle">
        <g className="wd-bob">
          <rect x="-12" y="-20" width="24" height="18" fill="#F7F1EA" />
          <rect x="-14" y="-6" width="28" height="8" fill="#FFFCF8" />
          <rect x="-8" y="2" width="6" height="3" fill="#F4E7E4" />
          <rect x="2" y="2" width="6" height="3" fill="#F4E7E4" />
          <image
            href="/sprites/bride.png"
            x="-20"
            y="-76"
            width="40"
            height="58"
            style={{ imageRendering: "pixelated" }}
          />
        </g>
      </g>
      {showName && label ? <Nameplate label={label} y={-88} highlight /> : null}
    </g>
  )
}

function shade(hex: string, amount: number) {
  const n = Number.parseInt(hex.slice(1), 16)
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amount))
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amount))
  const b = Math.max(0, Math.min(255, (n & 255) + amount))
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`
}

function CatGuest({
  guest,
  mood,
  showName,
  highlight,
  facing,
}: {
  guest: Guest
  mood: FigureMood
  showName: boolean
  highlight: boolean
  facing: 1 | -1
}) {
  const look = lookForGuest(guest)
  const fur = look.hair
  const dark = shade(fur, -28)
  const light = shade(fur, 28)
  const female = guest.gender === "female"
  const moodClass = mood === "walk" ? "is-walking" : mood === "cheer" ? "is-cheering" : "is-idle"
  const step = `${0.36 + (guest.id.length % 4) * 0.04}s`
  const label = guest.name

  return (
    <g>
      {label ? <title>{label}</title> : null}
      <ellipse cx="0" cy="3" rx={highlight ? 14 : 11} ry="3.2" fill="#2A2623" opacity="0.2" />
      {highlight ? (
        <ellipse cx="0" cy="-22" rx="18" ry="26" fill="none" stroke="#B8956A" strokeWidth="1.2" className="wd-ring" />
      ) : null}
      {showName && label ? <Nameplate label={label} y={-62} highlight={highlight} /> : null}
      <g transform={`scale(${facing} 1)`}>
        <g className={moodClass} style={{ ["--wd-step" as string]: step }}>
          <g className="wd-bob">
            <g className="wd-tail" transform="translate(12 -8)">
              <rect x="0" y="-2" width="10" height="4" fill={fur} />
              <rect x="8" y="-6" width="6" height="4" fill={dark} />
            </g>
            <g transform="translate(-7 0)">
              <g className="wd-leg-l">
                <rect x="-3" y="-1" width="5" height="8" fill={dark} />
                <rect x="-2" y="6" width="5" height="3" fill="#2A2623" />
              </g>
            </g>
            <g transform="translate(6 0)">
              <g className="wd-leg-r">
                <rect x="-3" y="-1" width="5" height="8" fill={fur} />
                <rect x="-2" y="6" width="5" height="3" fill="#2A2623" />
              </g>
            </g>
            <g shapeRendering="crispEdges">
              <rect x="-13" y="-22" width="26" height="18" fill={fur} />
              <rect x="-9" y="-18" width="16" height="10" fill={light} />
              <rect x="-12" y="-42" width="24" height="22" fill={fur} />
              <rect x="-16" y="-52" width="8" height="12" fill={fur} />
              <rect x="8" y="-52" width="8" height="12" fill={fur} />
              <rect x="-14" y="-50" width="4" height="6" fill="#E7B4B8" />
              <rect x="10" y="-50" width="4" height="6" fill="#E7B4B8" />
              <rect x="-7" y="-36" width="4" height="4" fill="#1A1410" />
              <rect x="3" y="-36" width="4" height="4" fill="#1A1410" />
              <rect x="-6" y="-35" width="2" height="2" fill="#fff" />
              <rect x="4" y="-35" width="2" height="2" fill="#fff" />
              <rect x="-2" y="-30" width="4" height="3" fill="#C48984" />
              <rect x="-10" y="-32" width="6" height="2" fill="#5C3A36" />
              <rect x="4" y="-32" width="6" height="2" fill="#5C3A36" />
              <rect x="-6" y="-24" width="12" height="4" fill={look.accent} />
              {female ? (
                <>
                  <rect x="10" y="-48" width="6" height="6" fill={look.outfit} />
                  <rect x="14" y="-46" width="6" height="6" fill={look.outfitDark} />
                </>
              ) : (
                <rect x="8" y="-20" width="4" height="4" fill={look.outfit} />
              )}
            </g>
            {mood === "cheer" ? (
              <g className="wd-heart" transform="translate(16 -54)">
                <path d="M0 3.2 C-4.2 -2.2 -0.8 -6.2 0 -3.2 C0.8 -6.2 4.2 -2.2 0 3.2 Z" fill="#C48984" />
              </g>
            ) : null}
          </g>
        </g>
      </g>
    </g>
  )
}

export function Character({
  role = "guest",
  guest,
  mood = "idle",
  showName = true,
  highlight = false,
  name,
  facing = 1,
}: {
  role?: FigureRole
  guest?: Guest
  mood?: FigureMood
  showName?: boolean
  highlight?: boolean
  name?: string
  facing?: 1 | -1
}) {
  if (role === "groom") {
    return <PixelGroom label={name ?? "Chonprakun"} highlight={highlight} showName={showName} />
  }
  if (role === "bride") {
    return <PixelBride label={name ?? "แทต"} highlight={highlight} showName={showName} />
  }
  return (
    <CatGuest
      guest={guest as Guest}
      mood={mood}
      showName={showName}
      highlight={highlight}
      facing={facing}
    />
  )
}
