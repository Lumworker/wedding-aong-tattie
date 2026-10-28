import { spriteForGuest } from "@/lib/appearance"
import { COUPLE } from "@/lib/event"
import { attendanceLabel, sideLabel } from "@/lib/labels"
import type { Guest } from "@/lib/types"
import { cn } from "@/lib/utils"

function GuestPortrait({ guest }: { guest: Guest }) {
  const sprite = spriteForGuest(guest)
  const { atlas } = sprite
  const sx = sprite.col * atlas.frames * atlas.frameW
  const sy = sprite.row * atlas.frameH
  const height = guest.isCompanion ? 41 : 58
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
        "inline-flex items-center rounded-full px-2.5 py-1 text-[13px] leading-normal font-medium",
        tone === "sage" && "bg-sage/25 text-sage-deep",
        tone === "blush" && "bg-blush/50 text-rose",
        tone === "muted" && "bg-muted text-muted-foreground"
      )}
    >
      {children}
    </span>
  )
}

function partyHeadline(main: Guest, count: number) {
  const side =
    main.side === "groom"
      ? `ฝั่ง${COUPLE.groomNickname}`
      : main.side === "bride"
        ? `ฝั่ง${COUPLE.brideNickname}`
        : null
  const attendance = main.attendance === "attending" ? "เข้าร่วม" : "ยังไม่แน่ใจ"
  return [side, attendance, `${count} คน`].filter(Boolean).join(" · ")
}

/** Party card: shared side and attendance once, then a row per person. */
export function PartySummary({
  guests,
  empty,
}: {
  guests: Guest[]
  empty?: string
}) {
  const main = guests.find((guest) => !guest.isCompanion) ?? guests[0]
  const ordered = main ? [main, ...guests.filter((guest) => guest.id !== main.id)] : []

  if (!main) {
    return (
      <p className="rounded-2xl border border-dashed border-border px-3 py-4 text-[15px] leading-relaxed text-muted-foreground">
        {empty ?? "ยังไม่มีรายชื่อในคณะนี้"}
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-border bg-card">
      <p className="border-b border-border px-4 py-3 text-[15px] leading-relaxed font-medium text-ink">{partyHeadline(main, guests.length)}</p>
      <ul className="divide-y divide-border">
        {ordered.map((guest) => (
          <li key={guest.id} className="flex items-center gap-3 px-4 py-3">
            <GuestPortrait guest={guest} />
            <p className="min-w-0 flex-1 text-base leading-relaxed font-medium break-words text-ink">{guest.name}</p>
            {guest.isCompanion ? <Badge>ผู้ติดตาม</Badge> : null}
          </li>
        ))}
      </ul>
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
            <p className="text-[13px] text-muted-foreground">{guests.length} คน</p>
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
          <p className="text-[13px] text-muted-foreground">{guests.length} คน</p>
        </div>
      ) : null}
      {guests.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-3 py-4 text-[15px] text-muted-foreground">{empty}</p>
      ) : (
        <>
          <ul className="divide-y divide-border overflow-hidden rounded-[1.4rem] border border-border bg-card">
            {shown.map((guest) => (
              <li key={guest.id} className="flex items-center gap-3 px-3 py-2.5">
                <StatusDot attending={guest.attendance === "attending"} />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] leading-relaxed font-medium break-words">{guest.name}</p>
                  <p className="text-[13px] leading-normal text-muted-foreground">
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
              <summary className="cursor-pointer text-[15px] text-muted-foreground">และอีก {extra.length} คน</summary>
              <ul className="mt-2 divide-y divide-border overflow-hidden rounded-[1.4rem] border border-border bg-card">
                {extra.map((guest) => (
                  <li key={guest.id} className="flex items-center gap-3 px-3 py-2.5">
                    <StatusDot attending={guest.attendance === "attending"} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] leading-relaxed font-medium break-words">{guest.name}</p>
                      <p className="text-[13px] leading-5 text-muted-foreground">{attendanceLabel(guest.attendance)}</p>
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
