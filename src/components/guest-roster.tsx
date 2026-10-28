import type { ReactNode } from "react"
import { spriteForGuest } from "@/lib/appearance"
import { attendanceLabel, sideLabel } from "@/lib/labels"
import type { Guest } from "@/lib/types"
import { cn } from "@/lib/utils"

function GuestPortrait({ guest }: { guest: Guest }) {
  const sprite = spriteForGuest(guest)
  const { atlas } = sprite
  const sx = sprite.col * atlas.frames * atlas.frameW
  const sy = sprite.row * atlas.frameH
  const height = guest.isCompanion ? 36 : 58
  const width = Math.round((atlas.frameW / atlas.frameH) * height)

  return (
    <span className="flex h-[4.25rem] w-14 shrink-0 items-end justify-center rounded-2xl bg-muted px-1 pb-1">
      <svg
        width={width}
        height={height}
        viewBox={`${sx} ${sy} ${atlas.frameW} ${atlas.frameH}`}
        aria-hidden="true"
        className="block overflow-hidden"
      >
        <image
          href={atlas.href}
          width={atlas.width}
          height={atlas.height}
          style={{ imageRendering: "pixelated" }}
        />
      </svg>
    </span>
  )
}

function StatusDot({ attending }: { attending: boolean }) {
  return (
    <span
      className={cn("size-2.5 shrink-0 rounded-full", attending ? "bg-sage-deep" : "bg-blush-deep")}
      aria-hidden="true"
    />
  )
}

function Badge({ children, tone = "muted" }: { children: string; tone?: "muted" | "sage" | "blush" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        tone === "sage" && "bg-sage/25 text-sage-deep",
        tone === "blush" && "bg-blush/50 text-rose",
        tone === "muted" && "bg-muted text-muted-foreground"
      )}
    >
      {children}
    </span>
  )
}

/** Party card: each guest with the same pixel sprite used in the venue. */
export function PartySummary({
  guests,
  empty,
  footer,
}: {
  guests: Guest[]
  empty?: string
  footer?: ReactNode
}) {
  const main = guests.find((guest) => !guest.isCompanion) ?? guests[0]
  const ordered = main
    ? [main, ...guests.filter((guest) => guest.id !== main.id)]
    : []

  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-border bg-card">
      {ordered.length === 0 ? (
        <p className="px-4 py-4 text-sm text-muted-foreground">{empty ?? "ยังไม่มีรายชื่อในคณะนี้"}</p>
      ) : (
        <ul>
          {ordered.map((guest) => (
            <li key={guest.id} className="flex items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0">
              <GuestPortrait guest={guest} />
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-ink", guest.isCompanion ? "text-sm font-medium" : "font-serif text-lg leading-tight")}>
                  {guest.name}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <StatusDot attending={guest.attendance === "attending"} />
                  {guest.side ? <Badge>{sideLabel(guest.side)}</Badge> : null}
                  <Badge tone={guest.attendance === "attending" ? "sage" : "blush"}>
                    {attendanceLabel(guest.attendance)}
                  </Badge>
                  {guest.isCompanion ? <Badge>ผู้ติดตาม</Badge> : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {footer}
    </div>
  )
}

export function GuestRoster({
  title,
  guests,
  empty,
  compact = false,
}: {
  title?: string
  guests: Guest[]
  empty?: string
  /** Hide companions as separate rows; show under registrant. */
  compact?: boolean
}) {
  if (compact) {
    return (
      <section>
        {title ? (
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h2 className="font-serif text-xl">{title}</h2>
            <p className="text-xs text-muted-foreground">{guests.length} คน</p>
          </div>
        ) : null}
        <PartySummary guests={guests} empty={empty} />
      </section>
    )
  }

  const preview = 8
  const shown = guests.slice(0, preview)
  const extra = guests.slice(preview)

  return (
    <section>
      {title ? (
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-xl">{title}</h2>
          <p className="text-xs text-muted-foreground">{guests.length} คน</p>
        </div>
      ) : null}
      {guests.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <>
          <ul className="divide-y divide-border overflow-hidden rounded-[1.4rem] border border-border bg-card">
            {shown.map((guest) => (
              <li key={guest.id} className="flex items-center gap-3 px-3 py-2.5">
                <StatusDot attending={guest.attendance === "attending"} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{guest.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[guest.side ? sideLabel(guest.side) : null, attendanceLabel(guest.attendance)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          {extra.length > 0 ? (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-muted-foreground">และอีก {extra.length} คน</summary>
              <ul className="mt-2 divide-y divide-border overflow-hidden rounded-[1.4rem] border border-border bg-card">
                {extra.map((guest) => (
                  <li key={guest.id} className="flex items-center gap-3 px-3 py-2.5">
                    <StatusDot attending={guest.attendance === "attending"} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{guest.name}</p>
                      <p className="text-xs text-muted-foreground">{attendanceLabel(guest.attendance)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </>
      )}
    </section>
  )
}
