"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { EventTitle } from "@/components/event-title"
import { VenueCanvas } from "@/components/venue/venue-canvas"
import { COUPLE } from "@/lib/event"
import { ageLabel, attendanceLabel } from "@/lib/labels"
import { formatThaiMobile } from "@/lib/phone"
import { SEED_PARTY_PHONE } from "@/lib/seed-guests"
import type { Guest } from "@/lib/types"
import { cn } from "@/lib/utils"

function RosterGroup({
  title,
  hint,
  guests,
  empty,
}: {
  title: string
  hint?: string
  guests: Guest[]
  empty?: string
}) {
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl">{title}</h2>
        <p className="text-xs text-muted-foreground">{guests.length} คน</p>
      </div>
      {hint ? <p className="mb-2 text-xs leading-5 text-muted-foreground">{hint}</p> : null}
      {guests.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {guests.map((guest) => (
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
      )}
    </section>
  )
}

export function VenueScene({
  guests,
  phone,
  onEdit,
  onChangePhone,
}: {
  guests: Guest[]
  phone: string
  onEdit: () => void
  onChangePhone: () => void
}) {
  const [showNames, setShowNames] = useState(true)
  const mine = useMemo(() => guests.filter((guest) => guest.partyPhone === phone), [guests, phone])
  const others = useMemo(
    () => guests.filter((guest) => guest.partyPhone !== phone && guest.partyPhone !== SEED_PARTY_PHONE),
    [guests, phone]
  )
  const samples = useMemo(() => guests.filter((guest) => guest.partyPhone === SEED_PARTY_PHONE), [guests])
  const inside = guests.filter((guest) => guest.attendance === "attending").length
  const outside = guests.length - inside

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
        <p className="mt-3 hidden text-xs text-muted-foreground lg:block">บัญชีแขก {formatThaiMobile(phone)}</p>
      </header>

      <section
        id="venue"
        aria-labelledby="venue-title"
        className="relative min-h-[74dvh] bg-[linear-gradient(180deg,#f8d5cc_0%,#f7e6da_42%,#d5e6d2_100%)] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-full lg:min-h-0"
      >
        <h2 id="venue-title" className="sr-only">
          ฉากงานมงคลสมรสของ {COUPLE.groomNickname} และ {COUPLE.brideNickname}
        </h2>
        <VenueCanvas guests={guests} phone={phone} showNames={showNames} />

        <motion.p
          className="pointer-events-none absolute top-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/75 px-4 py-1.5 font-serif text-sm text-rose shadow-sm backdrop-blur"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: [0, 1, 1, 0], y: [8, 0, 0, -6] }}
          transition={{ duration: 3.4, times: [0, 0.12, 0.72, 1], ease: "easeOut" }}
        >
          ยินดีต้อนรับสู่งาน
        </motion.p>

        <div className="absolute inset-x-3 bottom-3 z-10 flex flex-wrap items-center justify-between gap-2">
          <p className="rounded-full bg-white/80 px-3 py-1.5 text-xs text-ink shadow-sm backdrop-blur">
            มาร่วมงาน {inside} · ส่งความยินดี {outside}
          </p>
          <Button
            type="button"
            variant="outline"
            aria-pressed={showNames}
            className="h-9 rounded-full bg-white/85 px-3 text-xs backdrop-blur"
            onClick={() => setShowNames((current) => !current)}
          >
            {showNames ? "ซ่อนชื่อแขก" : "แสดงชื่อแขก"}
          </Button>
        </div>
      </section>

      <section className="px-4 pt-2 pb-10 lg:col-start-1 lg:row-start-2 lg:overflow-y-auto lg:border-r lg:px-8 lg:pt-0 lg:pb-8">
        <p className="text-sm leading-6 text-muted-foreground lg:hidden">บัญชีแขก {formatThaiMobile(phone)}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          แมวที่มางานเดินบนทางเดิน แมวที่มาไม่ได้ส่งใจจากสนามด้านหน้า
        </p>
        <RosterGroup title="คณะของคุณ" guests={mine} empty="ยังไม่มีรายชื่อในคณะนี้" />
        {others.length > 0 ? <RosterGroup title="แขกบนเครื่องนี้" guests={others} /> : null}
        <RosterGroup
          title="แขกตัวอย่าง"
          hint="ชื่อชุดนี้ติดมากับเดโม เพื่อให้ฉากงานไม่ว่างเปล่า ก่อนมีแขกจริง"
          guests={samples}
          empty="ยังไม่มีแขกตัวอย่าง"
        />
      </section>
    </div>
  )
}
