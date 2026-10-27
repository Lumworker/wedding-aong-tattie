import { spriteForGuest } from "@/lib/appearance"
import { COUPLE } from "@/lib/event"
import { GUEST_ATLAS } from "@/lib/guest-atlas"
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

function PixelCouple({
  href,
  label,
  showName,
  w,
  h,
}: {
  href: string
  label: string
  showName: boolean
  w: number
  h: number
}) {
  return (
    <g>
      {label ? <title>{label}</title> : null}
      <ellipse cx="2" cy="4" rx={w * 0.28} ry="3.2" fill="#05040A" opacity="0.5" />
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
        </g>
      </g>
      {showName && label ? <Nameplate label={label} y={-h - 8} highlight hero /> : null}
    </g>
  )
}

function AtlasGuest({
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
  const sprite = spriteForGuest(guest)
  const sitting = mood === "sit"
  const walking = mood === "walk"
  const col = (walking ? GUEST_ATLAS.sideCol : GUEST_ATLAS.idleCol) + sprite.type
  const sx = col * GUEST_ATLAS.cell
  const sy = sprite.row * GUEST_ATLAS.cell
  const size = sitting ? 22 : 26
  const moodClass = walking ? "is-walking" : mood === "cheer" ? "is-cheering" : sitting ? "is-sitting" : "is-idle"
  const label = guest.name

  return (
    <g>
      {label ? <title>{label}</title> : null}
      {showName && label ? <Nameplate label={label} y={sitting ? -size - 6 : -size - 8} highlight={highlight} /> : null}
      <g transform={`scale(${facing} 1)`}>
        <ellipse cx="1" cy="3" rx={highlight ? 10 : 8} ry="2.6" fill="#05040A" opacity="0.45" />
        {highlight ? (
          <ellipse cx="0" cy={-size / 2} rx="16" ry="18" fill="none" stroke="#E8C878" strokeWidth="1.2" className="wd-ring" />
        ) : null}
        <g className={moodClass}>
          <g className="wd-bob">
            <g
              style={{
                filter: `hue-rotate(${sprite.hue}deg) saturate(${sprite.saturate}) brightness(${sprite.brightness})`,
              }}
            >
              <svg
                x={-size / 2}
                y={-size}
                width={size}
                height={size}
                viewBox={`${sx} ${sy} ${GUEST_ATLAS.cell} ${GUEST_ATLAS.cell}`}
                overflow="hidden"
              >
                <image
                  href="/sprites/guests.png"
                  width={GUEST_ATLAS.width}
                  height={GUEST_ATLAS.height}
                  style={{ imageRendering: "pixelated" }}
                />
              </svg>
            </g>
            {mood === "cheer" ? (
              <g className="wd-heart" transform={`translate(${size / 2 - 2} ${-size - 6})`}>
                <image href="/assets/tiddybub/ui/heart.svg" width="12" height="12" />
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
    return <PixelCouple href="/sprites/groom.png?v=4" label={name ?? COUPLE.groomNickname} showName={showName} w={48} h={68} />
  }
  if (role === "bride") {
    return <PixelCouple href="/sprites/bride.png?v=4" label={name ?? COUPLE.brideNickname} showName={showName} w={48} h={68} />
  }
  return (
    <AtlasGuest
      guest={guest as Guest}
      mood={mood}
      showName={showName}
      highlight={highlight}
      facing={facing}
    />
  )
}
