"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { EventTitle } from "@/components/event-title"
import { VenueCanvas } from "@/components/venue/venue-canvas"
import { WishField } from "@/components/venue/wish-field"
import { WishComposer } from "@/components/wish-composer"
import { COUPLE, VENUE_MAP } from "@/lib/event"
import { guestStore } from "@/lib/guest-store"
import { ageLabel, attendanceLabel } from "@/lib/labels"
import type { Guest, Wish } from "@/lib/types"
import { cn } from "@/lib/utils"

const ROSTER_PREVIEW = 12

function RosterGroup({
  title,
  guests,
  empty,
}: {
  title: string
  guests: Guest[]
  empty?: string
}) {
  const overflow = guests.length > ROSTER_PREVIEW
  const shown = overflow ? guests.slice(0, ROSTER_PREVIEW) : guests
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
            {shown.map((guest) => (
              <li key={guest.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2.5">
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
            ))}
          </ul>
          {overflow ? (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-muted-foreground">
                และอีก {guests.length - ROSTER_PREVIEW} คน
              </summary>
              <ul className="mt-2 flex flex-col gap-2">
                {guests.slice(ROSTER_PREVIEW).map((guest) => (
                  <li key={guest.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2.5">
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
                ))}
              </ul>
            </details>
          ) : null}
        </>
      )}
    </section>
  )
}

function VenueMap() {
  const src = `https://maps.google.com/maps?q=${VENUE_MAP.lat},${VENUE_MAP.lng}&z=16&output=embed`
  return (
    <section className="mt-6">
      <h2 className="font-serif text-xl">สถานที่</h2>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{VENUE_MAP.note}</p>
      <div className="mt-3 overflow-hidden rounded-[1.4rem] border border-border bg-card">
        <iframe
          title="แผนที่สถานที่จัดงาน"
          src={src}
          className="h-48 w-full border-0 grayscale-[20%]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </section>
  )
}

export function VenueScene({
  guests,
  wishes,
  phone,
  onEdit,
  onChangePhone,
}: {
  guests: Guest[]
  wishes: Wish[]
  phone: string
  onEdit: () => void
  onChangePhone: () => void
}) {
  const [showNames, setShowNames] = useState(false)
  const [showWishes, setShowWishes] = useState(true)
  const mine = useMemo(() => guests.filter((guest) => guest.partyPhone === phone), [guests, phone])
  const others = useMemo(
    () => guests.filter((guest) => guest.partyPhone !== phone),
    [guests, phone]
  )
  const inside = guests.filter((guest) => guest.attendance === "attending").length
  const outside = guests.length - inside

  function sendWish(from: string, text: string) {
    guestStore.addWish({
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `wish-${Date.now()}`,
      text,
      from,
      partyPhone: phone,
      createdAt: new Date().toISOString(),
    })
    setShowWishes(true)
  }

  return (
    <div className="min-h-dvh bg-background lg:grid lg:h-dvh lg:grid-cols-[minmax(280px,400px)_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)] lg:overflow-hidden">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-md lg:static lg:col-start-1 lg:row-start-1 lg:border-r lg:border-b-0 lg:px-8 lg:py-8">
        <div className="lg:hidden">
          <EventTitle variant="compact" />
        </div>
        <div className="hidden lg:block">
          <EventTitle variant="panel" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 lg:mt-6">
          <Button type="button" variant="outline" className="h-10 rounded-full bg-card px-4" onClick={onEdit}>
            แก้ไขการตอบรับ
          </Button>
          <Button type="button" variant="ghost" className="h-10 rounded-full px-4" onClick={onChangePhone}>
            ใช้เบอร์อื่น
          </Button>
        </div>
        <p className="mt-3 hidden text-xs text-muted-foreground lg:block">ลงทะเบียนด้วยเบอร์บนเครื่องนี้แล้ว</p>
      </header>

      <section
        id="venue"
        aria-labelledby="venue-title"
        className="relative min-h-[88dvh] h-[88dvh] overflow-hidden bg-[#121018] sm:min-h-[90dvh] sm:h-[90dvh] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-full lg:min-h-0"
      >
        <h2 id="venue-title" className="sr-only">
          ฉากงานมงคลสมรสของ {COUPLE.groomNickname} และ {COUPLE.brideNickname}
        </h2>
        <VenueCanvas guests={guests} phone={phone} showNames={showNames}>
          <WishField wishes={wishes} enabled={showWishes} />
        </VenueCanvas>

        <motion.p
          className="hd2d-hud pointer-events-none absolute top-4 left-1/2 z-10 -translate-x-1/2 px-4 py-1.5 font-serif text-sm"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: [0, 1, 1, 0], y: [8, 0, 0, -6] }}
          transition={{ duration: 3.4, times: [0, 0.12, 0.72, 1], ease: "easeOut" }}
        >
          ยินดีต้อนรับสู่งาน · แตะอ๋องหรือแทตตี้เพื่ออ่านประวัติ
        </motion.p>

        <div className="absolute inset-x-3 bottom-3 z-20 flex flex-wrap items-center justify-between gap-2">
          <p className="hd2d-hud px-3 py-1.5">
            มาร่วมงาน {inside} · ส่งความยินดี {outside}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              aria-pressed={showWishes}
              className="hd2d-hud h-9 rounded-none border-[#e8c878] px-3 text-xs hover:bg-[#2a2438] hover:text-[#f8e2b8]"
              onClick={() => setShowWishes((current) => !current)}
            >
              {showWishes ? "ซ่อนคำอวยพร" : "แสดงคำอวยพร"}
            </Button>
            <Button
              type="button"
              variant="outline"
              aria-pressed={showNames}
              className="hd2d-hud h-9 rounded-none border-[#e8c878] px-3 text-xs hover:bg-[#2a2438] hover:text-[#f8e2b8]"
              onClick={() => setShowNames((current) => !current)}
            >
              {showNames ? "ซ่อนชื่อแขก" : "แสดงชื่อแขก"}
            </Button>
          </div>
        </div>
      </section>

      <section className="px-4 pt-2 pb-10 lg:col-start-1 lg:row-start-2 lg:overflow-y-auto lg:border-r lg:px-8 lg:pt-0 lg:pb-8">
        <p className="text-sm leading-6 text-muted-foreground lg:hidden">ลงทะเบียนด้วยเบอร์บนเครื่องนี้แล้ว</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          แตะเจ้าบ่าวเจ้าสาวบนแท่นเพื่ออ่านประวัติ เขียนคำอวยพรด้านล่างแล้วเปิดการลอยบนฉากได้
        </p>
        <RosterGroup title="คณะของคุณ" guests={mine} empty="ยังไม่มีรายชื่อในคณะนี้" />
        {others.length > 0 ? <RosterGroup title="แขกบนเครื่องนี้" guests={others} /> : null}
        <WishComposer party={mine} onSend={sendWish} />
        <VenueMap />
      </section>
    </div>
  )
}
