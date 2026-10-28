"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import { motion } from "framer-motion"
import { PartySummary } from "@/components/guest-roster"
import { Button } from "@/components/ui/button"
import { EventTitle } from "@/components/event-title"
import { VenueCanvas } from "@/components/venue/venue-canvas"
import { WishComposer } from "@/components/wish-composer"
import { COUPLE, VENUE_MAP } from "@/lib/event"
import { guestStore } from "@/lib/guest-store"
import { newId } from "@/lib/id"
import { formatThaiMobile } from "@/lib/phone"
import type { Guest, Wish } from "@/lib/types"

function useIsAdmin() {
  return useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("popstate", onStoreChange)
      return () => window.removeEventListener("popstate", onStoreChange)
    },
    () => new URLSearchParams(window.location.search).has("admin"),
    () => false
  )
}

function HudToggle({
  on,
  onLabel,
  offLabel,
  onClick,
}: {
  on: boolean
  onLabel: string
  offLabel: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={on}
      className="hd2d-hud h-9 rounded-none border-[#e8c878] px-3 text-xs hover:bg-[#2a2438] hover:text-[#f8e2b8]"
      onClick={onClick}
    >
      {on ? onLabel : offLabel}
    </Button>
  )
}

function StatChip({ label, value, tone }: { label: string; value: number; tone: "sage" | "blush" }) {
  return (
    <div className="min-w-0 flex-1 rounded-2xl border border-border bg-card px-3 py-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`mt-0.5 font-display text-3xl leading-none ${tone === "sage" ? "text-sage-deep" : "text-rose"}`}>
        {value}
      </p>
    </div>
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
  const isAdmin = useIsAdmin()
  const [showWishes, setShowWishes] = useState(true)
  const mine = useMemo(() => guests.filter((guest) => guest.partyPhone === phone), [guests, phone])
  const inside = guests.filter((guest) => guest.attendance === "attending").length
  const unsure = guests.length - inside

  return (
    <div className="min-h-dvh bg-background lg:grid lg:h-dvh lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)] lg:overflow-hidden">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-md lg:static lg:col-start-1 lg:row-start-1 lg:border-r lg:border-b-0 lg:px-6 lg:pt-6 lg:pb-4">
        <div className="lg:hidden">
          <EventTitle variant="compact" />
        </div>
        <div className="hidden lg:block">
          <p className="text-[11px] font-medium tracking-[0.28em] text-rose uppercase">งานมงคลสมรส</p>
          <h1 className="mt-2 font-display text-4xl leading-none text-ink">
            {COUPLE.groomNickname}
            <span className="px-2 text-rose">&</span>
            {COUPLE.brideNickname}
          </h1>
          <p className="mt-2 font-serif text-base text-ink">{COUPLE.dateThai}</p>
        </div>
      </header>

      <section
        id="venue"
        aria-labelledby="venue-title"
        className="relative h-[72dvh] min-h-[72dvh] overflow-hidden bg-[#121018] sm:h-[78dvh] sm:min-h-[78dvh] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-full lg:min-h-0"
      >
        <h2 id="venue-title" className="sr-only">
          ฉากงานมงคลสมรสของ {COUPLE.groomNickname} และ {COUPLE.brideNickname}
        </h2>
        <VenueCanvas guests={guests} phone={phone} wishes={wishes} showWishes={showWishes} />
        <motion.p
          className="hd2d-hud pointer-events-none absolute top-4 left-1/2 z-10 -translate-x-1/2 px-4 py-1.5 font-serif text-sm"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: [0, 1, 1, 0], y: [8, 0, 0, -6] }}
          transition={{ duration: 3.4, times: [0, 0.12, 0.72, 1], ease: "easeOut" }}
        >
          ยินดีต้อนรับ · แตะอ๋องหรือแทตตี้เพื่ออ่านประวัติ
        </motion.p>
        <div className="absolute inset-x-3 bottom-3 z-20 flex flex-wrap items-center justify-between gap-2">
          {isAdmin ? (
            <p className="hd2d-hud px-3 py-1.5">
              เข้าร่วม {inside} · ยังไม่แน่ใจ {unsure}
            </p>
          ) : (
            <span />
          )}
          <div className="flex flex-wrap gap-2">
            <HudToggle on={showWishes} onLabel="ซ่อนคำอวยพร" offLabel="แสดงคำอวยพร" onClick={() => setShowWishes((v) => !v)} />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-5 px-4 pt-4 pb-10 lg:col-start-1 lg:row-start-2 lg:overflow-y-auto lg:border-r lg:px-6 lg:pt-0 lg:pb-6">
        {isAdmin ? (
          <div className="flex gap-2">
            <StatChip label="เข้าร่วมงาน" value={inside} tone="sage" />
            <StatChip label="ยังไม่แน่ใจ" value={unsure} tone="blush" />
          </div>
        ) : null}

        <section>
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h2 className="font-serif text-xl">คณะของคุณ</h2>
            <p className="text-xs text-muted-foreground">{mine.length} คน</p>
          </div>
          <PartySummary
            guests={mine}
            empty="ยังไม่มีรายชื่อในคณะนี้"
            footer={
              <div className="border-t border-border px-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink">{formatThaiMobile(phone)}</p>
                  <Button type="button" variant="ghost" className="h-9 rounded-full px-3" onClick={onChangePhone}>
                    📱 ใช้เบอร์อื่น
                  </Button>
                </div>
                <Button type="button" className="mt-2 h-10 w-full rounded-full" onClick={onEdit}>
                  ✏️ แก้ไขการตอบรับ
                </Button>
              </div>
            }
          />
        </section>

        <WishComposer
          party={mine}
          phone={phone}
          wishes={wishes}
          onSend={async (from, text) => {
            await guestStore.addWish({
              id: newId("wish"),
              text,
              from,
              partyPhone: phone,
              createdAt: new Date().toISOString(),
            })
            setShowWishes(true)
          }}
          onUpdate={async (wish) => {
            await guestStore.updateWish(wish)
            setShowWishes(true)
          }}
        />

        <section>
          <h2 className="font-serif text-xl">📍 สถานที่</h2>
          <p className="mt-1 font-medium text-ink">{VENUE_MAP.name}</p>
          <p className="text-xs text-muted-foreground">{VENUE_MAP.nameEn}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{VENUE_MAP.address}</p>
          <a
            href={VENUE_MAP.link}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex text-sm text-rose underline-offset-4 hover:underline"
          >
            เปิดใน Google Maps
          </a>
          <div className="mt-3 overflow-hidden rounded-[1.4rem] border border-border bg-card">
            <iframe
              title={`แผนที่${VENUE_MAP.name}`}
              src={VENUE_MAP.embed}
              className="h-44 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>
      </section>
    </div>
  )
}
