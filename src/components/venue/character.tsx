import { lookForGuest } from "@/lib/appearance"
import type { Guest } from "@/lib/types"

export type FigureRole = "guest" | "groom" | "bride"
export type FigureMood = "idle" | "walk" | "cheer" | "sit"

function Nameplate({
  label,
  y,
  highlight,
  hero = false,
}: {
  label: string
  y: number
  highlight: boolean
  hero?: boolean
}) {
  const glyphs = Array.from(label)
  const shown = glyphs.length > 14 ? `${glyphs.slice(0, 13).join("")}…` : label
  const width = Math.max(hero ? 42 : 34, Array.from(shown).length * 6.4 + 12)
  return (
    <g transform={`translate(0 ${y})`}>
      <rect x={-width / 2 + 2} y={-6} width={width} height={15} fill="#05040A" opacity="0.55" />
      <rect
        x={-width / 2}
        y={-8}
        width={width}
        height={15}
        fill={highlight || hero ? "#16141F" : "#121018"}
        stroke={highlight || hero ? "#E8C878" : "#6A5A44"}
        strokeWidth={hero ? 1.4 : 1}
      />
      <text
        y="0.5"
        textAnchor="middle"
        dominantBaseline="central"
        fill={highlight || hero ? "#F8E2B8" : "#E8DCC8"}
        fontSize={hero ? 10 : 8}
      >
        {shown}
      </text>
    </g>
  )
}

const COUPLE_SPRITE = { w: 50, h: 85 }

function PixelCouple({
  href,
  label,
  showName,
}: {
  href: string
  label: string
  showName: boolean
}) {
  const { w, h } = COUPLE_SPRITE
  return (
    <g>
      {label ? <title>{label}</title> : null}
      <ellipse cx="2" cy="5" rx="16" ry="4" fill="#05040A" opacity="0.55" />
      <g className="is-idle">
        <g className="wd-bob">
          <image
            href={href}
            x={-w / 2}
            y={-h}
            width={w}
            height={h}
            style={{ imageRendering: "pixelated" }}
          />
          <rect
            x={-w / 2}
            y={-h}
            width={w}
            height={h}
            fill="#FFD080"
            opacity="0.16"
            style={{ mixBlendMode: "overlay" }}
          />
        </g>
      </g>
      {showName && label ? <Nameplate label={label} y={-h - 8} highlight hero /> : null}
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
  const sitting = mood === "sit"
  const moodClass = mood === "walk" ? "is-walking" : mood === "cheer" ? "is-cheering" : "is-idle"
  const step = `${0.36 + (guest.id.length % 4) * 0.04}s`
  const label = guest.name

  return (
    <g>
      {label ? <title>{label}</title> : null}
      {showName && label ? <Nameplate label={label} y={sitting ? -28 : -34} highlight={highlight} /> : null}
      <g transform={`scale(${facing * 0.56} 0.56)`}>
        <ellipse cx="2" cy="4" rx={highlight ? 15 : 12} ry="3.4" fill="#05040A" opacity="0.5" />
        {highlight ? (
          <ellipse cx="0" cy="-22" rx="18" ry="26" fill="none" stroke="#E8C878" strokeWidth="1.2" className="wd-ring" />
        ) : null}
        <g className={moodClass} style={{ ["--wd-step" as string]: step }}>
          <g className="wd-bob">
            <g className="wd-tail" transform={`translate(12 ${sitting ? -4 : -8})`}>
              <rect x="0" y="-2" width="10" height="4" fill={fur} />
              <rect x="8" y={sitting ? 2 : -6} width="6" height="4" fill={dark} />
            </g>
            {sitting ? (
              <g shapeRendering="crispEdges">
                <rect x="-16" y="-16" width="30" height="16" fill={fur} />
                <rect x="-10" y="-12" width="16" height="8" fill={light} />
              </g>
            ) : (
              <>
                <g transform="translate(-7 0)">
                  <g className="wd-leg-l">
                    <rect x="-3" y="-1" width="5" height="8" fill={dark} />
                    <rect x="-2" y="6" width="5" height="3" fill="#1A1410" />
                  </g>
                </g>
                <g transform="translate(6 0)">
                  <g className="wd-leg-r">
                    <rect x="-3" y="-1" width="5" height="8" fill={fur} />
                    <rect x="-2" y="6" width="5" height="3" fill="#1A1410" />
                  </g>
                </g>
                <g shapeRendering="crispEdges">
                  <rect x="-13" y="-22" width="26" height="18" fill={fur} />
                  <rect x="-9" y="-18" width="16" height="10" fill={light} />
                </g>
              </>
            )}
            <g shapeRendering="crispEdges">
              <rect x="-12" y={sitting ? -34 : -42} width="24" height="22" fill={fur} />
              <rect x="-16" y={sitting ? -44 : -52} width="8" height="12" fill={fur} />
              <rect x="8" y={sitting ? -44 : -52} width="8" height="12" fill={fur} />
              <rect x="-14" y={sitting ? -42 : -50} width="4" height="6" fill="#E7B4B8" />
              <rect x="10" y={sitting ? -42 : -50} width="4" height="6" fill="#E7B4B8" />
              <rect x="-7" y={sitting ? -28 : -36} width="4" height="4" fill="#1A1410" />
              <rect x="3" y={sitting ? -28 : -36} width="4" height="4" fill="#1A1410" />
              <rect x="-6" y={sitting ? -27 : -35} width="2" height="2" fill="#fff" />
              <rect x="4" y={sitting ? -27 : -35} width="2" height="2" fill="#fff" />
              <rect x="-2" y={sitting ? -22 : -30} width="4" height="3" fill="#C48984" />
              <rect x="-6" y={sitting ? -16 : -24} width="12" height="4" fill={look.accent} />
              {female ? (
                <>
                  <rect x="10" y={sitting ? -40 : -48} width="6" height="6" fill={look.outfit} />
                  <rect x="14" y={sitting ? -38 : -46} width="6" height="6" fill={look.outfitDark} />
                </>
              ) : (
                <rect x="8" y={sitting ? -12 : -20} width="4" height="4" fill={look.outfit} />
              )}
            </g>
            <rect
              x="-18"
              y="-56"
              width="36"
              height="64"
              fill="#FFD080"
              opacity="0.12"
              style={{ mixBlendMode: "overlay" }}
            />
            {mood === "cheer" ? (
              <g className="wd-heart" transform="translate(16 -54)">
                <path d="M0 3.2 C-4.2 -2.2 -0.8 -6.2 0 -3.2 C0.8 -6.2 4.2 -2.2 0 3.2 Z" fill="#E8C878" />
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
    return <PixelCouple href="/sprites/groom.png?v=2" label={name ?? "อ๋อง"} showName={showName} />
  }
  if (role === "bride") {
    return <PixelCouple href="/sprites/bride.png?v=2" label={name ?? "แทต"} showName={showName} />
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
