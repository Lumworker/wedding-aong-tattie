"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import { PartySummary } from "@/components/guest-roster"
import { Button } from "@/components/ui/button"
import { EventTitle } from "@/components/event-title"
import { VenueCanvas } from "@/components/venue/venue-canvas"
import { WishBoard } from "@/components/wish-board"
import { WishComposer } from "@/components/wish-composer"
import { COUPLE, VENUE_MAP } from "@/lib/event"
import { guestStore } from "@/lib/guest-store"
import { newId } from "@/lib/id"
import { attendanceLabel } from "@/lib/labels"
import { formatThaiMobile } from "@/lib/phone"
import type { Guest, Wish } from "@/lib/types"

const DIRECTIONS = `https://www.google.com/maps/dir/?api=1&destination=${VENUE_MAP.lat},${VENUE_MAP.lng}`

function SectionHeading({
  emoji,
  title,
  meta,
  detail,
}: {
  emoji: string
  title: string
  meta?: string
  detail?: string
}) {
  return (
    <div className="mb-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl leading-normal text-ink">
          <span className="mr-1.5" aria-hidden="true">
            {emoji}
          </span>
          {title}
        </h2>
        {meta ? <p className="shrink-0 text-[13px] leading-normal text-muted-foreground">{meta}</p> : null}
      </div>
      {detail ? <p className="mt-0.5 text-[13px] leading-normal text-muted-foreground">{detail}</p> : null}
    </div>
  )
}

function partyMeta(main: Guest | undefined) {
  if (!main) return undefined
  const side =
    main.side === "groom" ? `ฝั่ง${COUPLE.groomNickname}` : main.side === "bride" ? `ฝั่ง${COUPLE.brideNickname}` : null
  return [side, attendanceLabel(main.attendance)].filter(Boolean).join(" · ")
}

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

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
}

function MapSection() {
  return (
    <section id="map" className="scroll-mt-56">
      <SectionHeading emoji="📍" title="แผนที่" />
      <p className="text-[15px] leading-relaxed font-medium text-ink">
        {VENUE_MAP.name}
        <span className="font-normal text-muted-foreground"> · {VENUE_MAP.nameEn}</span>
      </p>
      <p className="mt-0.5 text-[13px] leading-6 text-muted-foreground">{VENUE_MAP.address}</p>
      <div className="mt-3 overflow-hidden rounded-[1.4rem] border border-border bg-card">
        <iframe
          title={`แผนที่${VENUE_MAP.name}`}
          src={VENUE_MAP.embed}
          className="pointer-events-none h-64 w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <a
        href={DIRECTIONS}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-center text-[15px] leading-normal font-medium text-primary-foreground hover:bg-rose hover:text-cream"
      >
        เปิดนำทาง
      </a>
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
  const [editToken, setEditToken] = useState<{ id: string; at: number } | null>(null)
  const mine = useMemo(() => guests.filter((guest) => guest.partyPhone === phone), [guests, phone])
  const mainGuest = mine.find((guest) => !guest.isCompanion) ?? mine[0]
  const inside = guests.filter((guest) => guest.attendance === "attending").length
  const unsure = guests.filter((guest) => guest.attendance === "unsure").length
  const declined = guests.filter((guest) => guest.attendance === "declined").length

  return (
    <div className="flex min-h-dvh flex-col lg:grid lg:h-dvh lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)] lg:overflow-hidden">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur-md lg:static lg:col-start-1 lg:row-start-1 lg:border-r lg:border-b-0 lg:px-6 lg:pt-6 lg:pb-4">
        <div className="lg:hidden">
          <EventTitle variant="compact" />
          <p className="text-sm text-muted-foreground">{VENUE_MAP.name}</p>
        </div>
        <div className="hidden lg:block">
          <p className="text-[13px] font-medium tracking-[0.28em] text-rose uppercase">งานมงคลสมรส</p>
          <h1 className="mt-2 font-display text-4xl leading-snug text-ink">
            {COUPLE.groomNickname}
            <span className="px-2 text-rose">&</span>
            {COUPLE.brideNickname}
          </h1>
          <p className="mt-2 font-serif text-base text-ink">{COUPLE.dateThai}</p>
          <p className="mt-1 text-sm text-muted-foreground">{VENUE_MAP.name}</p>
        </div>
        <p className="mt-1 text-[13px] leading-normal text-muted-foreground">{formatThaiMobile(phone)}</p>
      </header>

      <section
        id="venue"
        aria-labelledby="venue-title"
        className="relative order-3 h-[30dvh] min-h-[190px] max-h-[260px] overflow-hidden bg-[#121018] sm:h-[36dvh] lg:order-none lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-full lg:max-h-none lg:min-h-0"
      >
        <h2 id="venue-title" className="sr-only">
          ฉากงานมงคลสมรสของ {COUPLE.groomNickname} และ {COUPLE.brideNickname}
        </h2>
        <VenueCanvas guests={guests} phone={phone} wishes={wishes} showWishes />
        <p className="hd2d-hud pointer-events-none absolute bottom-3 left-3 z-10 px-3 py-1.5 font-serif text-sm">
          แตะอ๋องหรือแทตตี้เพื่ออ่านประวัติ
        </p>
      </section>

      <div className="contents lg:col-start-1 lg:row-start-2 lg:flex lg:min-h-0 lg:flex-col lg:gap-5 lg:overflow-y-auto lg:border-r lg:px-6 lg:pb-6">
        {isAdmin ? (
          <div className="order-2 flex gap-2 px-4 pt-4 lg:px-0 lg:pt-0">
            <StatChip label="เข้าร่วม" value={inside} tone="sage" />
            <StatChip label="ยังไม่แน่ใจ" value={unsure} tone="blush" />
            <StatChip label="ไปไม่ได้" value={declined} tone="blush" />
          </div>
        ) : null}

        <section id="party" className="order-2 scroll-mt-24 px-4 pt-4 lg:px-0 lg:pt-0">
          <SectionHeading
            emoji="👥"
            title="คำตอบของคุณ"
            meta={mine.length > 0 ? `${mine.length} คน` : undefined}
            detail={partyMeta(mainGuest)}
          />
          <p className="mb-2 text-[13px] leading-normal text-muted-foreground">
            {COUPLE.dateThai} · {VENUE_MAP.name}
          </p>
          <PartySummary guests={mine} empty="ยังไม่มีรายชื่อในคณะนี้" hideHeadline />
          <Button type="button" className="mt-3 h-12 w-full rounded-full text-base" onClick={onEdit}>
            แก้ไขการตอบรับ
          </Button>
          <a
            href={DIRECTIONS}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-full border border-border bg-card px-4 text-[15px] font-medium text-ink"
          >
            เปิดนำทาง
          </a>
          <button
            type="button"
            className="mt-1 flex min-h-11 w-full items-center justify-center text-sm text-muted-foreground"
            onClick={onChangePhone}
          >
            เปลี่ยนเบอร์
          </button>
        </section>

        <section id="wishes" className="order-4 flex scroll-mt-24 flex-col gap-3 px-4 pt-5 lg:px-0 lg:pt-0">
          <SectionHeading emoji="💌" title="อวยพร" meta={wishes.length > 0 ? `${wishes.length} ข้อความ` : undefined} />
          <WishComposer
            party={mine}
            wishes={wishes}
            editToken={editToken}
            onSend={async (from, text) => {
              await guestStore.addWish({
                id: newId("wish"),
                text,
                from,
                partyPhone: phone,
                createdAt: new Date().toISOString(),
              })
            }}
            onUpdate={async (wish) => {
              await guestStore.updateWish(wish)
            }}
          />
          <WishBoard
            wishes={wishes}
            phone={phone}
            onEdit={(wish) => {
              setEditToken({ id: wish.id, at: Date.now() })
              scrollToSection("wishes")
            }}
          />
        </section>

        <div className="order-5 px-4 pt-5 pb-10 lg:px-0 lg:pt-0 lg:pb-0">
          <MapSection />
        </div>
      </div>
    </div>
  )
}
