"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import { motion } from "framer-motion"
import { PartySummary } from "@/components/guest-roster"
import { Button } from "@/components/ui/button"
import { EventTitle } from "@/components/event-title"
import { VenueCanvas } from "@/components/venue/venue-canvas"
import { WishBoard } from "@/components/wish-board"
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
      className="h-11 min-h-11 rounded-full border-[#3a3148] bg-[#1a1522] px-4 text-[15px] font-medium text-[#f6f1ea] shadow-[0_8px_18px_rgba(0,0,0,0.35)] hover:bg-[#2a2438] hover:text-[#f6f1ea]"
      onClick={onClick}
    >
      {on ? onLabel : offLabel}
    </Button>
  )
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
}

function MapSection() {
  const [expanded, setExpanded] = useState(false)
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${VENUE_MAP.lat},${VENUE_MAP.lng}`

  return (
    <section id="map" className="scroll-mt-56">
      <h2 className="font-serif text-xl leading-normal">สถานที่</h2>
      <p className="mt-1 text-[13px] leading-6 text-muted-foreground">{VENUE_MAP.note}</p>
      <div className="mt-3 overflow-hidden rounded-[1.4rem] border border-border bg-card">
        <iframe
          title="แผนที่สถานที่จัดงาน"
          src={`https://maps.google.com/maps?q=${VENUE_MAP.lat},${VENUE_MAP.lng}&z=16&output=embed`}
          className={`pointer-events-none w-full border-0 ${expanded ? "h-80" : "h-56"}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-auto min-h-11 w-full rounded-full px-4 py-2.5 text-[15px]"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "ย่อแผนที่" : "ขยายแผนที่"}
        </Button>
        <a
          href={directions}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-center text-[15px] leading-normal font-medium text-primary-foreground"
        >
          เปิดนำทางใน Google Maps
        </a>
      </div>
    </section>
  )
}

function StatChip({ label, value, tone }: { label: string; value: number; tone: "sage" | "blush" }) {
  return (
    <div className="min-w-0 flex-1 rounded-2xl border border-border bg-card px-3 py-2.5">
      <p className="text-[13px] text-muted-foreground">{label}</p>
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
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur-md lg:static lg:col-start-1 lg:row-start-1 lg:border-r lg:border-b-0 lg:px-6 lg:pt-6 lg:pb-4">
        <div className="lg:hidden">
          <EventTitle variant="compact" />
        </div>
        <div className="hidden lg:block">
          <p className="text-[13px] font-medium tracking-[0.28em] text-rose uppercase">งานมงคลสมรส</p>
          <h1 className="mt-2 font-display text-4xl leading-snug text-ink">
            {COUPLE.groomNickname}
            <span className="px-2 text-rose">&</span>
            {COUPLE.brideNickname}
          </h1>
          <p className="mt-2 font-serif text-base text-ink">{COUPLE.dateThai}</p>
        </div>
        <p className="mt-2 inline-flex h-8 items-center rounded-full bg-muted px-3 text-[13px] text-muted-foreground">
          {formatThaiMobile(phone)}
        </p>
        <nav className="mt-2.5 grid grid-cols-3 gap-2 lg:hidden" aria-label="ส่วนของหน้า">
          {[
            ["#party", "คณะ"],
            ["#wishes", "อวยพร"],
            ["#map", "แผนที่"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="inline-flex h-11 items-center justify-center rounded-full bg-muted px-2 text-center text-[15px] leading-normal font-medium text-ink"
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <section
        id="venue"
        aria-labelledby="venue-title"
        className="relative h-[42dvh] min-h-[220px] max-h-[380px] overflow-hidden bg-[#121018] sm:h-[50dvh] sm:max-h-[460px] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-full lg:max-h-none lg:min-h-0"
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
        <div className="absolute inset-x-3 bottom-3 z-10 flex flex-wrap items-end justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 min-h-11 rounded-full border-[#3a3148] bg-[#fffaf0] px-4 text-[15px] font-medium text-[#1c1612] hover:bg-[#fffaf0]"
              onClick={() => scrollToSection(wishes.length ? "wishes-all" : "wishes")}
            >
              อ่านคำอวยพรทั้งหมด
            </Button>
            {isAdmin ? (
              <p className="inline-flex h-11 items-center rounded-full bg-[#1a1522] px-3 text-[13px] text-[#f6f1ea]">
                เข้าร่วม {inside} · ยังไม่แน่ใจ {unsure}
              </p>
            ) : null}
          </div>
          <HudToggle on={showWishes} onLabel="ซ่อนคำอวยพร" offLabel="แสดงคำอวยพร" onClick={() => setShowWishes((v) => !v)} />
        </div>
      </section>

      <section className="flex flex-col gap-5 px-4 pt-4 pb-10 lg:col-start-1 lg:row-start-2 lg:overflow-y-auto lg:border-r lg:px-6 lg:pt-0 lg:pb-6">
        {isAdmin ? (
          <div className="flex gap-2">
            <StatChip label="เข้าร่วมงาน" value={inside} tone="sage" />
            <StatChip label="ยังไม่แน่ใจ" value={unsure} tone="blush" />
          </div>
        ) : null}

        <section id="party" className="scroll-mt-56">
          <h2 className="mb-2 font-serif text-xl">คณะของคุณ</h2>
          <PartySummary guests={mine} empty="ยังไม่มีรายชื่อในคณะนี้" />
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" className="h-11 min-h-11 w-full rounded-full bg-card px-4 text-[15px] sm:w-auto" onClick={onEdit}>
              แก้ไขการตอบรับ
            </Button>
            <Button type="button" variant="secondary" className="h-11 min-h-11 w-full rounded-full px-4 text-[15px] sm:w-auto" onClick={onChangePhone}>
              ใช้เบอร์อื่น
            </Button>
          </div>
        </section>

        <section id="wishes" className="flex scroll-mt-56 flex-col gap-5">
          <WishBoard wishes={wishes} />
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
        </section>

        <MapSection />
      </section>
    </div>
  )
}
