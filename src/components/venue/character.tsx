import { lookForGuest } from "@/lib/appearance"
import type { Guest } from "@/lib/types"

export type FigureRole = "guest" | "groom" | "bride"
export type FigureMood = "idle" | "walk" | "cheer"

function Nameplate({ label, y, highlight }: { label: string; y: number; highlight: boolean }) {
  const glyphs = Array.from(label)
  const shown = glyphs.length > 14 ? `${glyphs.slice(0, 13).join("")}…` : label
  const width = Math.max(34, Array.from(shown).length * 6.8 + 14)
  return (
    <g transform={`translate(0 ${y})`}>
      <rect
        x={-width / 2}
        y={-8}
        width={width}
        height={16}
        rx={8}
        fill={highlight ? "#3F5344" : "#FFFCF8"}
        fillOpacity="0.94"
        stroke={highlight ? "#B8956A" : "#E4D8CC"}
        strokeWidth="0.7"
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
      <ellipse cx="0" cy="3" rx="16" ry="4" fill="#2A2623" opacity="0.16" />
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
      <ellipse cx="0" cy="3" rx="16" ry="4" fill="#2A2623" opacity="0.16" />
      {highlight ? (
        <ellipse cx="0" cy="-40" rx="24" ry="42" fill="none" stroke="#B8956A" strokeWidth="1.3" className="wd-ring" />
      ) : null}
      <g className="is-idle">
        <g className="wd-bob">
          <path d="M-14 -18 Q-18 0 -12 2 H12 Q18 0 14 -18 Z" fill="#F7F1EA" />
          <path d="M-10 -4 Q0 4 10 -4" fill="#E8D8D4" opacity="0.55" />
          <ellipse cx="-7" cy="2.4" rx="4.2" ry="1.8" fill="#F4E7E4" />
          <ellipse cx="7" cy="2.4" rx="4.2" ry="1.8" fill="#F4E7E4" />
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

function CatGuest({
  guest,
  mood,
  showName,
  highlight,
}: {
  guest: Guest
  mood: FigureMood
  showName: boolean
  highlight: boolean
}) {
  const look = lookForGuest(guest)
  const fur = look.hair
  const belly = look.skin
  const female = guest.gender === "female"
  const moodClass = mood === "walk" ? "is-walking" : mood === "cheer" ? "is-cheering" : "is-idle"
  const step = `${0.4 + (guest.id.length % 5) * 0.05}s`
  const label = guest.name

  return (
    <g>
      {label ? <title>{label}</title> : null}
      <ellipse cx="0" cy="3" rx={highlight ? 16 : 12} ry="3.6" fill="#2A2623" opacity="0.14" />
      {highlight ? (
        <ellipse cx="0" cy="-22" rx="20" ry="28" fill="none" stroke="#B8956A" strokeWidth="1.2" className="wd-ring" />
      ) : null}
      <g className={moodClass} style={{ ["--wd-step" as string]: step }}>
        <g className="wd-bob">
          <g className="wd-tail" transform="translate(14 -10)">
            <path d="M0 0 Q16 -10 18 8" fill="none" stroke={fur} strokeWidth="4.2" strokeLinecap="round" />
            <path d="M0 0 Q16 -10 18 8" fill="none" stroke={look.outfitDark} strokeWidth="1.4" strokeLinecap="round" opacity="0.35" />
          </g>
          <g transform="translate(-7 0)">
            <g className="wd-leg-l">
              <rect x="-3" y="-2" width="6" height="10" rx="3" fill={fur} />
            </g>
          </g>
          <g transform="translate(7 0)">
            <g className="wd-leg-r">
              <rect x="-3" y="-2" width="6" height="10" rx="3" fill={look.outfitDark} />
            </g>
          </g>
          <ellipse cx="0" cy="-12" rx="16" ry="13" fill={fur} />
          <ellipse cx="0" cy="-10" rx="10" ry="8" fill={belly} opacity="0.7" />
          <circle cx="0" cy="-32" r="13.5" fill={fur} />
          <polygon points="-11,-42 -6,-54 -1,-43" fill={fur} />
          <polygon points="1,-43 6,-54 11,-42" fill={fur} />
          <polygon points="-9,-43 -6,-50 -4,-43" fill="#E7B4B8" />
          <polygon points="4,-43 6,-50 9,-43" fill="#E7B4B8" />
          <circle cx="-4.2" cy="-33" r="1.7" fill="#2A2623" />
          <circle cx="4.2" cy="-33" r="1.7" fill="#2A2623" />
          <circle cx="-3.6" cy="-33.6" r="0.5" fill="#fff" />
          <circle cx="4.8" cy="-33.6" r="0.5" fill="#fff" />
          <ellipse cx="0" cy="-29.4" rx="1.5" ry="1" fill="#C48984" />
          <path d="M-3 -28.2 Q0 -26.4 3 -28.2" fill="none" stroke="#5C3A36" strokeWidth="0.8" strokeLinecap="round" />
          <path d="M-8 -30 H-4 M8 -30 H4" stroke="#5C3A36" strokeWidth="0.6" />
          <rect x="-5" y="-21" width="10" height="3.2" rx="1.4" fill={look.accent} />
          {female ? (
            <g transform="translate(10 -40) rotate(18)">
              <circle cx="-3" cy="0" r="3.1" fill={look.outfit} />
              <circle cx="3" cy="0" r="3.1" fill={look.outfit} />
              <circle cx="0" cy="2" r="2.2" fill={look.outfitDark} />
            </g>
          ) : (
            <circle cx="8" cy="-22" r="2.2" fill={look.accent} />
          )}
          {mood === "cheer" ? (
            <g className="wd-heart" transform="translate(16 -48)">
              <path d="M0 3.2 C-4.2 -2.2 -0.8 -6.2 0 -3.2 C0.8 -6.2 4.2 -2.2 0 3.2 Z" fill="#C48984" />
            </g>
          ) : null}
        </g>
      </g>
      {showName && label ? <Nameplate label={label} y={-58} highlight={highlight} /> : null}
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
}: {
  role?: FigureRole
  guest?: Guest
  mood?: FigureMood
  showName?: boolean
  highlight?: boolean
  name?: string
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
    />
  )
}
