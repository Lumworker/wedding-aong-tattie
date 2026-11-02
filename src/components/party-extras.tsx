"use client"

import { useEffect, useState } from "react"
import { CalendarPlus, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { googleCalendarUrl, icsDataUrl } from "@/lib/calendar"
import { COUPLE, RSVP_DEADLINE_THAI, VENUE_MAP } from "@/lib/event"
import { travelIcon, travelLabel } from "@/lib/labels"
import { ROUTES } from "@/lib/routes"
import type { Party } from "@/lib/types"

function Chip({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#D8C8AC] bg-[#F7F1E4] px-3 py-1 text-[13px] leading-tight text-ink"
    >
      {children}
    </button>
  )
}

/** Banner for unsure / declined, status chips, add-to-calendar and share. */
export function PartyStatus({
  party,
  onEdit,
  onUpdateAnswer,
  onWriteWish,
}: {
  party: Party
  /** Opens the review step. */
  onEdit: () => void
  /** Opens step 1 to change attending / unsure / declined. */
  onUpdateAnswer: () => void
  onWriteWish: () => void
}) {
  const [shared, setShared] = useState<string | null>(null)
  const main = party.guests.find((guest) => !guest.isCompanion) ?? party.guests[0]
  if (!main) return null
  const kids = party.guests.filter((guest) => guest.isCompanion && guest.ageGroup === "child").length
  const travel = party.travel
  const declined = main.attendance === "declined"
  const details = `${COUPLE.dateThai} · ${VENUE_MAP.name}\n${VENUE_MAP.link}`

  async function share() {
    const url = `${window.location.origin}${ROUTES.welcome}`
    const text = `การ์ดเชิญงานแต่งงาน ${COUPLE.groomNickname} & ${COUPLE.brideNickname} · ${COUPLE.dateThai}`
    try {
      if (navigator.share) {
        await navigator.share({ title: text, text, url })
        return
      }
      await navigator.clipboard.writeText(`${text}\n${url}`)
      setShared("คัดลอกลิงก์แล้ว")
    } catch {
      setShared(null)
    }
  }

  return (
    <div className="mb-3 flex flex-col gap-3">
      {declined ? (
        <div className="rounded-2xl bg-[#F7F1E4] px-4 py-3 text-[14px] leading-relaxed text-ink">
          <p className="font-medium">ขอบคุณที่แจ้งให้รู้นะ</p>
          <p className="text-muted-foreground">
            ถึงไปไม่ได้ ก็ยังฝากคำอวยพรถึง{COUPLE.groomNickname}กับ{COUPLE.brideNickname}ได้
          </p>
          <Button type="button" className="mt-2 h-11 rounded-full px-5 text-[15px]" onClick={onWriteWish}>
            เขียนคำอวยพร
          </Button>
        </div>
      ) : null}

      {main.attendance === "unsure" ? (
        <div className="rounded-2xl border border-[#D8C8AC] bg-[#FFFCF8] px-4 py-3 text-[14px] leading-relaxed text-ink">
          <p>
            ยังไม่แน่ใจใช่ไหม ช่วยอัปเดตคำตอบเมื่อแน่ใจ
            {RSVP_DEADLINE_THAI ? ` ภายใน ${RSVP_DEADLINE_THAI}` : ""} จะได้เตรียมที่นั่งให้ครบ
          </p>
          <button
            type="button"
            className="mt-1 min-h-11 text-[14px] font-medium underline underline-offset-4"
            onClick={onUpdateAnswer}
          >
            อัปเดตคำตอบ
          </button>
        </div>
      ) : null}

      {declined ? null : (
        <div className="flex flex-wrap gap-2">
          <Chip label="แก้จำนวนคน" onClick={onEdit}>
            มา {party.guests.length} คน{kids ? ` (เด็ก ${kids})` : ""}
          </Chip>
          {travel?.mode ? (
            <Chip label="แก้การเดินทาง" onClick={onEdit}>
              {/* eslint-disable-next-line @next/next/no-img-element -- pixel sprite */}
              <img src={travelIcon(travel.mode)} alt="" width={18} height={18} className="size-[18px] [image-rendering:pixelated]" />
              {travel.mode === "drive" && travel.needsParking
                ? `ที่จอด ${travel.cars.length} คัน · ${travel.cars.map((car) => car.plate).join(", ")}`
                : travelLabel(travel.mode)}
            </Chip>
          ) : null}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <a
          href={googleCalendarUrl(details)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-[14px] font-medium text-ink"
        >
          <CalendarPlus className="size-4" aria-hidden="true" />
          เพิ่มลงปฏิทิน
        </a>
        <a
          href={icsDataUrl(details)}
          download="wedding-aong-tattie.ics"
          className="inline-flex min-h-11 items-center px-1 text-[13px] text-muted-foreground underline underline-offset-4"
        >
          iPhone / Outlook
        </a>
        <button
          type="button"
          onClick={share}
          className="inline-flex h-11 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-[14px] font-medium text-ink"
        >
          <Share2 className="size-4" aria-hidden="true" />
          แชร์การ์ด
        </button>
        {shared ? (
          <span role="status" className="text-[13px] text-muted-foreground">
            {shared}
          </span>
        ) : null}
      </div>
    </div>
  )
}

const NUDGE_KEY = "webding-wish-nudge:"

/** One-time card after the walk home: invite a blessing. Never shows again once closed. */
export function WishNudge({ selfKey, hasWish, onWrite }: { selfKey: string; hasWish: boolean; onWrite: () => void }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (hasWish) return
    let seen = false
    try {
      seen = window.localStorage.getItem(NUDGE_KEY + selfKey) === "1"
    } catch {
      seen = false
    }
    if (seen) return
    const timer = window.setTimeout(() => setOpen(true), 2600)
    return () => window.clearTimeout(timer)
  }, [hasWish, selfKey])

  function close() {
    setOpen(false)
    try {
      window.localStorage.setItem(NUDGE_KEY + selfKey, "1")
    } catch {
      /* ignore */
    }
  }

  if (!open || hasWish) return null
  return (
    <div
      role="dialog"
      aria-label="ฝากคำอวยพร"
      className="fixed inset-x-3 bottom-[max(env(safe-area-inset-bottom),0.75rem)] z-50 mx-auto max-w-md rounded-[1.4rem] border border-[#E6D5C3] bg-[#FFFCF8] p-4 shadow-[0_24px_50px_-24px_rgba(90,62,48,0.55)] motion-safe:animate-in motion-safe:slide-in-from-bottom-4 lg:right-6 lg:left-auto"
    >
      <p className="font-serif text-lg text-ink">
        💌 ฝากคำอวยพรถึง{COUPLE.groomNickname}กับ{COUPLE.brideNickname}ไหม
      </p>
      <p className="mt-1 text-[13px] leading-normal text-muted-foreground">คำอวยพรจะลอยอยู่ในฉากงานให้ทั้งคู่ได้อ่าน</p>
      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          className="h-11 flex-1 rounded-full text-[15px]"
          onClick={() => {
            close()
            onWrite()
          }}
        >
          เขียนคำอวยพร
        </Button>
        <button type="button" className="h-11 rounded-full px-4 text-[14px] text-muted-foreground" onClick={close}>
          ไว้ทีหลัง
        </button>
      </div>
    </div>
  )
}
