import { ageLabel, attendanceLabel } from "@/lib/labels"
import type { Guest } from "@/lib/types"
import { cn } from "@/lib/utils"

const PREVIEW = 12

function Row({ guest }: { guest: Guest }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2.5">
      <span
        className={cn(
          "size-2.5 shrink-0 rounded-full",
          guest.attendance === "attending" ? "bg-sage-deep" : "bg-blush-deep"
        )}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{guest.name}</p>
        <p className="text-xs text-muted-foreground">
          {ageLabel(guest.ageGroup)} · {attendanceLabel(guest.attendance)}
        </p>
      </div>
    </li>
  )
}

export function GuestRoster({
  title,
  guests,
  empty,
}: {
  title: string
  guests: Guest[]
  empty?: string
}) {
  const extra = guests.slice(PREVIEW)
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl">{title}</h2>
        <p className="text-xs text-muted-foreground">{guests.length} คน</p>
      </div>
      {guests.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {guests.slice(0, PREVIEW).map((guest) => (
              <Row key={guest.id} guest={guest} />
            ))}
          </ul>
          {extra.length > 0 ? (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-muted-foreground">และอีก {extra.length} คน</summary>
              <ul className="mt-2 flex flex-col gap-2">
                {extra.map((guest) => (
                  <Row key={guest.id} guest={guest} />
                ))}
              </ul>
            </details>
          ) : null}
        </>
      )}
    </section>
  )
}
