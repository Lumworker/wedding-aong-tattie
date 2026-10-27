import { attendanceLabel, sideLabel } from "@/lib/labels"
import type { Guest } from "@/lib/types"
import { cn } from "@/lib/utils"

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

/** Compact party summary: registrant + follower count, not one card per companion. */
export function PartySummary({
  guests,
  empty,
}: {
  guests: Guest[]
  empty?: string
}) {
  const main = guests.find((guest) => !guest.isCompanion) ?? guests[0]
  const companions = guests.filter((guest) => guest.isCompanion || (main && guest.id !== main.id))

  if (!main) {
    return (
      <p className="rounded-2xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
        {empty ?? "ยังไม่มีรายชื่อในคณะนี้"}
      </p>
    )
  }

  return (
    <div className="rounded-[1.4rem] border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <StatusDot attending={main.attendance === "attending"} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-xl leading-tight text-ink">{main.name}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {main.side ? <Badge>{sideLabel(main.side)}</Badge> : null}
            <Badge tone={main.attendance === "attending" ? "sage" : "blush"}>
              {attendanceLabel(main.attendance)}
            </Badge>
          </div>
          {companions.length > 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              ผู้ติดตาม <span className="font-medium text-ink">{companions.length}</span> คน
              <span className="text-muted-foreground/80"> · รวมทั้งคณะ {guests.length} คน</span>
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">มาคนเดียว</p>
          )}
        </div>
      </div>
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
