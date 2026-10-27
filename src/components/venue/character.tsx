import type { ReactNode } from "react"
import { BRIDE_LOOK, GROOM_LOOK, lookForGuest, type Look } from "@/lib/appearance"
import type { AgeGroup, Gender, Guest } from "@/lib/types"

export type FigureRole = "guest" | "groom" | "bride"
export type FigureMood = "idle" | "walk" | "cheer" | "peek"

type Metrics = {
  headR: number
  headY: number
  shoulderY: number
  hipY: number
  legH: number
  hemY: number
}

const ADULT: Metrics = {
  headR: 12.4,
  headY: -76,
  shoulderY: -60,
  hipY: -34,
  legH: 28,
  hemY: -2,
}

const CHILD: Metrics = {
  headR: 12.8,
  headY: -58,
  shoulderY: -44,
  hipY: -26,
  legH: 20,
  hemY: -2,
}

function Arm({
  side,
  shoulderY,
  sleeve,
  skin,
  className,
  children,
}: {
  side: 1 | -1
  shoulderY: number
  sleeve: string
  skin: string
  className: string
  children?: ReactNode
}) {
  return (
    <g transform={`translate(${side * 15} ${shoulderY})`}>
      <g className={className}>
        <rect x="-3.4" y="0" width="6.8" height="20" rx="3.2" fill={sleeve} />
        <circle cx="0" cy="21" r="3.4" fill={skin} />
        {children}
      </g>
    </g>
  )
}

function Bouquet() {
  return (
    <g transform="translate(1 26)">
      <circle cx="-4" cy="2" r="3.5" fill="#E07070" />
      <circle cx="3.5" cy="1" r="3.7" fill="#FFF8E8" />
      <circle cx="0" cy="-3.2" r="3.3" fill="#F09090" />
      <circle cx="5" cy="5" r="2.3" fill="#48C85A" />
      <circle cx="-5" cy="5.5" r="2.2" fill="#2E9A3A" />
    </g>
  )
}

function GroomGlasses({ headY }: { headY: number }) {
  return (
    <g>
      <rect x="-9.6" y={headY - 3.4} width="8.4" height="6.4" rx="1.4" fill="#C8E8F8" fillOpacity="0.45" stroke="#2A2623" strokeWidth="1.15" />
      <rect x="1.2" y={headY - 3.4} width="8.4" height="6.4" rx="1.4" fill="#C8E8F8" fillOpacity="0.45" stroke="#2A2623" strokeWidth="1.15" />
      <path d="M-1.2 -0.2 H1.2" transform={`translate(0 ${headY})`} stroke="#2A2623" strokeWidth="1.1" />
      <path d={`M-9.6 ${headY - 0.4} H-12.2`} stroke="#2A2623" strokeWidth="1.05" />
      <path d={`M9.6 ${headY - 0.4} H12.2`} stroke="#2A2623" strokeWidth="1.05" />
    </g>
  )
}

function BrideSunglasses({ headY, headR }: { headY: number; headR: number }) {
  const y = headY - headR - 1
  return (
    <g transform={`translate(0 ${y}) rotate(-18)`}>
      <rect x="-11" y="-3.2" width="9.2" height="6.2" rx="1.6" fill="#2A2623" />
      <rect x="1.8" y="-3.2" width="9.2" height="6.2" rx="1.6" fill="#2A2623" />
      <rect x="-9.4" y="-1.8" width="5.6" height="2.2" fill="#6A8AA0" opacity="0.55" />
      <rect x="3.4" y="-1.8" width="5.6" height="2.2" fill="#6A8AA0" opacity="0.55" />
      <path d="M-1.8 0 H1.8" stroke="#2A2623" strokeWidth="1.2" />
    </g>
  )
}

function BackHair({
  role,
  gender,
  hair,
  headY,
}: {
  role: FigureRole
  gender: Gender
  hair: string
  headY: number
}) {
  if (role === "bride") {
    return (
      <g>
        <ellipse cx="-11" cy={headY + 10} rx="7.5" ry="16" fill={hair} />
        <ellipse cx="11" cy={headY + 12} rx="7.2" ry="17" fill={hair} />
        <ellipse cx="-13" cy={headY + 24} rx="5.5" ry="9" fill="#5A3828" />
        <ellipse cx="13" cy={headY + 26} rx="5.2" ry="9" fill="#5A3828" />
        <path
          d={`M-8 ${headY - 2} C-28 ${headY + 16} -24 ${headY + 54} -4 ${headY + 58}`}
          fill="#fff"
          opacity="0.42"
          className="wd-veil"
        />
      </g>
    )
  }

  if (gender !== "female") return null

  return (
    <g>
      <ellipse cx="-10" cy={headY + 14} rx="5.5" ry="14" fill={hair} />
      <ellipse cx="10" cy={headY + 14} rx="5.5" ry="14" fill={hair} />
    </g>
  )
}

function FrontHair({
  role,
  gender,
  hair,
  headY,
  headR,
}: {
  role: FigureRole
  gender: Gender
  hair: string
  headY: number
  headR: number
}) {
  if (role === "bride") {
    return (
      <g>
        <path
          d={`M${-headR - 1} ${headY + 1} Q0 ${headY - headR - 8} ${headR + 1} ${headY + 1} Q${headR - 2} ${headY - 6} 0 ${headY - 4} Q${-headR + 2} ${headY - 6} ${-headR - 1} ${headY + 1}`}
          fill={hair}
        />
        <ellipse cx={-headR + 1} cy={headY + 6} rx="4.2" ry="7" fill={hair} />
        <ellipse cx={headR - 1} cy={headY + 8} rx="4" ry="7.4" fill={hair} />
        <path
          d={`M${-headR + 2} ${headY + 4} Q${-headR - 2} ${headY + 16} ${-headR + 6} ${headY + 18}`}
          fill="none"
          stroke="#4A2C20"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </g>
    )
  }

  if (role === "groom") {
    return (
      <g>
        <path
          d={`M${-headR + 0.4} ${headY - 1} Q0 ${headY - headR - 5.5} ${headR - 0.4} ${headY - 1} Q${headR - 3} ${headY - 5} 0 ${headY - 3.2} Q${-headR + 3} ${headY - 5} ${-headR + 0.4} ${headY - 1}`}
          fill={hair}
        />
        <path
          d={`M${-headR + 1} ${headY + 2} Q${-headR - 1} ${headY + 8} ${-headR + 3} ${headY + 6}`}
          fill={hair}
        />
      </g>
    )
  }

  if (gender === "female") {
    return (
      <g>
        <path
          d={`M${-headR + 0.4} ${headY - 2} Q0 ${headY - headR - 6} ${headR - 0.4} ${headY - 2} Q${headR - 2} ${headY - 5} 0 ${headY - 4} Q${-headR + 2} ${headY - 5} ${-headR + 0.4} ${headY - 2}`}
          fill={hair}
        />
        <circle cx={headR - 1} cy={headY - 7} r="2.1" fill="#E7B4B8" />
      </g>
    )
  }

  return (
    <path
      d={`M${-headR + 0.6} ${headY - 1} Q0 ${headY - headR - 4.5} ${headR - 0.6} ${headY - 1} Q${headR - 3} ${headY - 4} 0 ${headY - 3} Q${-headR + 3} ${headY - 4} ${-headR + 0.6} ${headY - 1}`}
      fill={hair}
    />
  )
}

function Face({
  skin,
  headY,
  headR,
  smile = "open",
}: {
  skin: string
  headY: number
  headR: number
  smile?: "open" | "soft"
}) {
  return (
    <g>
      <circle cx="0" cy={headY} r={headR} fill={skin} />
      <ellipse cx="-5" cy={headY + 3.2} rx="2.2" ry="1.2" fill="#F2A090" opacity="0.55" />
      <ellipse cx="5" cy={headY + 3.2} rx="2.2" ry="1.2" fill="#F2A090" opacity="0.55" />
      <ellipse cx="-3.6" cy={headY - 0.6} rx="1.55" ry="1.85" fill="#1A1410" />
      <ellipse cx="3.6" cy={headY - 0.6} rx="1.55" ry="1.85" fill="#1A1410" />
      <circle cx="-3.1" cy={headY - 1.2} r="0.45" fill="#fff" />
      <circle cx="4.1" cy={headY - 1.2} r="0.45" fill="#fff" />
      {smile === "open" ? (
        <ellipse cx="0" cy={headY + 5.2} rx="3.1" ry="2.1" fill="#C45A5A" />
      ) : (
        <path
          d={`M-3 ${headY + 4.2} Q0 ${headY + 6.6} 3 ${headY + 4.2}`}
          fill="none"
          stroke="#8F5E58"
          strokeWidth="1.05"
          strokeLinecap="round"
        />
      )}
    </g>
  )
}

function Dress({ look, m, full }: { look: Look; m: Metrics; full: boolean }) {
  const hem = full ? 24 : 18
  const waist = 12
  return (
    <g className="wd-skirt">
      <path
        d={`M${-waist} ${m.shoulderY + 2}
          Q${-hem - 1} ${(m.shoulderY + m.hemY) / 2} ${-hem} ${m.hemY}
          L${hem} ${m.hemY}
          Q${hem + 1} ${(m.shoulderY + m.hemY) / 2} ${waist} ${m.shoulderY + 2} Z`}
        fill={look.outfit}
      />
      <path
        d={`M${-hem + 3} ${m.hemY - 7} Q0 ${m.hemY - 1} ${hem - 3} ${m.hemY - 7}`}
        fill={look.outfitDark}
        opacity="0.28"
      />
      <path d={`M-9 ${m.shoulderY + 15} H9 L7 ${m.shoulderY + 20} H-7 Z`} fill={look.accent} />
    </g>
  )
}

function Suit({ look, m, groom }: { look: Look; m: Metrics; groom: boolean }) {
  return (
    <g>
      <g transform={`translate(-6 ${m.hipY})`}>
        <g className="wd-leg-l">
          <rect x="-3.5" y="0" width="7" height={m.legH} rx="3" fill={look.outfitDark} />
          <ellipse cx="1" cy={m.legH + 1.2} rx="5" ry="2.3" fill={look.shoe} />
        </g>
      </g>
      <g transform={`translate(6 ${m.hipY})`}>
        <g className="wd-leg-r">
          <rect x="-3.5" y="0" width="7" height={m.legH} rx="3" fill={groom ? "#343B42" : look.outfit} />
          <ellipse cx="1" cy={m.legH + 1.2} rx="5" ry="2.3" fill={look.shoe} />
        </g>
      </g>
      <path
        d={`M-13 ${m.shoulderY}
          L-15 ${m.hipY + 3}
          Q0 ${m.hipY + 11} 15 ${m.hipY + 3}
          L13 ${m.shoulderY}
          Q0 ${m.shoulderY + 7} -13 ${m.shoulderY}`}
        fill={look.outfit}
      />
      <path d={`M-4.2 ${m.shoulderY + 1} L0 ${m.shoulderY + 15} L4.2 ${m.shoulderY + 1}`} fill={groom ? "#F7F1EA" : look.accent} />
      {groom ? <path d={`M0 ${m.shoulderY + 3} L2.3 ${m.shoulderY + 16} L-2.3 ${m.shoulderY + 16} Z`} fill={look.accent} /> : null}
      {groom ? <circle cx="7.2" cy={m.shoulderY + 13} r="2.4" fill="#E7B4B8" /> : null}
    </g>
  )
}

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
        fill={highlight ? "#2E6A38" : "#FFFCF8"}
        fillOpacity="0.94"
        stroke={highlight ? "#E07070" : "#E4D8CC"}
        strokeWidth="0.7"
      />
      <text y="0.5" textAnchor="middle" dominantBaseline="central" fill={highlight ? "#F6F1EA" : "#2A2623"} fontSize="9">
        {shown}
      </text>
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
  const gender: Gender = role === "bride" ? "female" : role === "groom" ? "male" : (guest?.gender ?? "other")
  const ageGroup: AgeGroup = role === "guest" ? (guest?.ageGroup ?? "adult") : "adult"
  const look: Look = role === "groom" ? GROOM_LOOK : role === "bride" ? BRIDE_LOOK : lookForGuest(guest as Guest)
  const m = role === "guest" && ageGroup === "child" ? CHILD : ADULT
  const dressed = role === "bride" || gender === "female"
  const label = name ?? (role === "bride" ? "แทต" : role === "groom" ? "Chonprakun" : (guest?.name ?? ""))
  const moodClass = mood === "walk" ? "is-walking" : mood === "cheer" ? "is-cheering" : mood === "peek" ? "is-peeking" : "is-idle"
  const step = `${0.42 + ((label.length + (guest?.id.length ?? 3)) % 5) * 0.05}s`
  const peek = mood === "peek"
  const headY = peek ? 0 : m.headY
  const headR = m.headR

  if (peek) {
    return (
      <g>
        {label ? <title>{label}</title> : null}
        <g className={moodClass} style={{ ["--wd-step" as string]: step }}>
          <g className="wd-bob">
            <BackHair role={role} gender={gender} hair={look.hair} headY={headY} />
            <Face skin={look.skin} headY={headY} headR={headR} smile="open" />
            <FrontHair role={role} gender={gender} hair={look.hair} headY={headY} headR={headR} />
          </g>
        </g>
        {showName && label ? <Nameplate label={label} y={-headR - 14} highlight={highlight} /> : null}
      </g>
    )
  }

  return (
    <g>
      {label ? <title>{label}</title> : null}
      <ellipse cx="0" cy="2" rx={highlight ? 18 : 13} ry="4" fill="#2A2623" opacity="0.13" />
      {highlight ? (
        <ellipse cx="0" cy={m.headY / 2} rx="22" ry={Math.abs(m.headY) * 0.48} fill="none" stroke="#E07070" strokeWidth="1.3" className="wd-ring" />
      ) : null}
      <g className={moodClass} style={{ ["--wd-step" as string]: step }}>
        <g className="wd-bob">
          <BackHair role={role} gender={gender} hair={look.hair} headY={m.headY} />
          {dressed ? <Dress look={look} m={m} full={role === "bride"} /> : <Suit look={look} m={m} groom={role === "groom"} />}
          {dressed ? (
            <>
              <g transform={`translate(-8 ${m.hemY + 1})`}>
                <g className="wd-shoe-l">
                  <ellipse cx="0" cy="0" rx="4.4" ry="2.1" fill={role === "bride" ? "#F4E7E4" : look.shoe} />
                </g>
              </g>
              <g transform={`translate(8 ${m.hemY + 1})`}>
                <g className="wd-shoe-r">
                  <ellipse cx="0" cy="0" rx="4.4" ry="2.1" fill={role === "bride" ? "#F4E7E4" : look.shoe} />
                </g>
              </g>
            </>
          ) : null}
          <Arm
            side={-1}
            shoulderY={m.shoulderY}
            sleeve={dressed ? look.outfitDark : look.outfit}
            skin={look.skin}
            className="wd-arm-l"
          />
          <Arm
            side={1}
            shoulderY={m.shoulderY}
            sleeve={dressed ? look.outfitDark : look.outfit}
            skin={look.skin}
            className="wd-arm-r"
          >
            {role === "bride" ? <Bouquet /> : null}
            {mood === "cheer" ? (
              <g className="wd-heart" transform="translate(10 -8)">
                <path d="M0 3.2 C-4.2 -2.2 -0.8 -6.2 0 -3.2 C0.8 -6.2 4.2 -2.2 0 3.2 Z" fill="#E07070" />
              </g>
            ) : null}
          </Arm>
          <Face skin={look.skin} headY={m.headY} headR={m.headR} smile={role === "guest" ? "soft" : "open"} />
          <FrontHair role={role} gender={gender} hair={look.hair} headY={m.headY} headR={m.headR} />
          {role === "groom" ? <GroomGlasses headY={m.headY} /> : null}
          {role === "bride" ? <BrideSunglasses headY={m.headY} headR={m.headR} /> : null}
        </g>
      </g>
      {showName && label ? (
        <Nameplate label={label} y={m.headY - m.headR - 12} highlight={highlight || role !== "guest"} />
      ) : null}
    </g>
  )
}
