"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown, Clock3, MapPin, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import { Button, buttonVariants } from "@/components/ui/button"
import { EventTitle, Ornament } from "@/components/event-title"
import { VenueCanvas } from "@/components/venue/venue-canvas"
import { COUPLE } from "@/lib/event"
import { ageLabel, attendanceLabel } from "@/lib/labels"
import { formatThaiMobile } from "@/lib/phone"
import { SEED_PARTY_PHONE } from "@/lib/seed-guests"
import { SCENE } from "@/lib/scene-layout"
import type { Guest, Party } from "@/lib/types"
import { cn } from "@/lib/utils"

const REGISTER_PIN = {
  x: (SCENE.groom.x + SCENE.bride.x) / 2,
  y: SCENE.groom.y + 86,
}

function RegisterPin({
  registered,
  onRegister,
}: {
  registered: boolean
  onRegister: () => void
}) {
  const pinRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const pin = pinRef.current
    const svg = pin?.closest("[data-venue-stage]")?.querySelector("svg")
    if (!pin || !svg) return
    const marker = pin
    const drawing = svg

    function place() {
      if (!(drawing instanceof SVGSVGElement)) return
      const ctm = drawing.getScreenCTM()
      const stage = marker.closest("[data-venue-stage]") as HTMLElement | null
      if (!ctm || !stage) return
      const point = drawing.createSVGPoint()
      point.x = REGISTER_PIN.x
      point.y = REGISTER_PIN.y
      const screen = point.matrixTransform(ctm)
      const box = stage.getBoundingClientRect()
      marker.style.left = `${screen.x - box.left}px`
      marker.style.top = `${screen.y - box.top}px`
    }

    const frame = window.requestAnimationFrame(place)
    const observer = new ResizeObserver(place)
    observer.observe(drawing)
    window.addEventListener("resize", place)
    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener("resize", place)
    }
  }, [])

  return (
    <div
      ref={pinRef}
      className="pointer-events-none absolute top-[64%] left-1/2 z-20 -translate-x-1/2"
    >
      <motion.div
        className="pointer-events-auto flex flex-col items-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5 }}
      >
        <Button
          type="button"
          onClick={onRegister}
          className="h-12 rounded-full px-7 text-base shadow-[0_16px_40px_-18px_rgba(63,83,68,0.85)]"
        >
          {registered ? "แก้ไขการตอบรับ" : "ลงทะเบียน"}
        </Button>
        <p className="mt-2 max-w-48 text-center text-[11px] leading-4 text-ink/80 drop-shadow-[0_1px_6px_rgba(246,241,234,0.9)]">
          {registered ? "เปลี่ยนรายชื่อคณะของคุณ" : "ตอบรับคำเชิญด้วยเบอร์มือถือ"}
        </p>
      </motion.div>
    </div>
  )
}

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
    <section className="mt-8">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="font-serif text-xl">{title}</h3>
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

export function LandingPage({
  guests,
  phone,
  party,
  onRegister,
}: {
  guests: Guest[]
  phone: string | null
  party: Party | null
  onRegister: () => void
}) {
  const [showNames, setShowNames] = useState(true)
  const mine = phone ? guests.filter((guest) => guest.partyPhone === phone) : []
  const others = guests.filter((guest) => guest.partyPhone !== phone && guest.partyPhone !== SEED_PARTY_PHONE)
  const samples = guests.filter((guest) => guest.partyPhone === SEED_PARTY_PHONE)
  const inside = guests.filter((guest) => guest.attendance === "attending").length
  const outside = guests.length - inside
  const registered = Boolean(party)

  return (
    <div className="bg-background">
      <section
        id="venue"
        data-venue-stage
        aria-labelledby="venue-title"
        className="relative h-dvh overflow-hidden bg-[linear-gradient(180deg,#f8d5cc_0%,#f7e6da_42%,#d5e6d2_100%)]"
      >
        <h1 id="venue-title" className="sr-only">
          {COUPLE.groomShort} และ {COUPLE.brideShort} · งานมงคลสมรสที่{COUPLE.venueThai}
        </h1>
        <VenueCanvas guests={guests} phone={phone} showNames={showNames}>
          <RegisterPin registered={registered} onRegister={onRegister} />
        </VenueCanvas>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-[#f8d5cc]/80 to-transparent px-4 pt-5 pb-16">
          <div className="pointer-events-auto mx-auto flex max-w-3xl items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium tracking-[0.28em] text-rose uppercase">งานมงคลสมรส</p>
              <p className="font-display text-2xl leading-none text-ink sm:text-3xl">
                {COUPLE.groomShort}
                <span className="px-1.5 text-rose">&</span>
                {COUPLE.brideShort}
              </p>
            </div>
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
        </div>

        <motion.p
          className="pointer-events-none absolute top-[4.75rem] left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/75 px-4 py-1.5 font-serif text-sm text-rose shadow-sm backdrop-blur sm:top-20"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: [0, 1, 1, 0], y: [8, 0, 0, -6] }}
          transition={{ duration: 3.4, times: [0, 0.12, 0.72, 1], ease: "easeOut" }}
        >
          ยินดีต้อนรับสู่งาน
        </motion.p>

        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-3 bg-gradient-to-t from-[#c5d8c2]/90 via-[#c5d8c2]/35 to-transparent px-4 pt-16 pb-4">
          <p className="rounded-full bg-white/80 px-3 py-1.5 text-xs text-ink shadow-sm backdrop-blur">
            ในโบสถ์ {inside} · นอกโบสถ์ {outside}
          </p>
          <a
            href="#details"
            className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-medium text-ink underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            เลื่อนดูรายละเอียดงาน
            <ChevronDown className="size-4 motion-safe:animate-bounce" />
          </a>
        </div>
      </section>

      <section id="details" className="mx-auto max-w-2xl px-5 py-16 sm:py-24">
        <EventTitle variant="hero" />

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          <article className="rounded-[1.6rem] border border-border bg-card p-5">
            <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-rose uppercase">
              <Clock3 className="size-4" />
              วันเวลา
            </p>
            <p className="mt-3 font-serif text-2xl leading-snug text-ink">{COUPLE.dateThai}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              พิธีสมรส ณ โบสถ์ในวันคริสต์มาสตามปฏิทินไทย พ.ศ. 2570
            </p>
          </article>
          <article className="rounded-[1.6rem] border border-border bg-card p-5">
            <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-rose uppercase">
              <MapPin className="size-4" />
              สถานที่
            </p>
            <p className="mt-3 font-serif text-2xl leading-snug text-ink">{COUPLE.venueThai}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{COUPLE.venueEn}</p>
          </article>
        </div>

        <article className="mt-3 rounded-[1.6rem] border border-border bg-card p-5">
          <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-rose uppercase">
            <Sparkles className="size-4" />
            รายละเอียดงาน
          </p>
          <p className="mt-3 text-sm leading-7 text-foreground">
            {COUPLE.groom} และ {COUPLE.bride} ({COUPLE.brideNickname}) ขอเชิญร่วมเป็นสักขีพยานในพิธีสมรส
            ผู้ที่ลงทะเบียนมาร่วมงานจะเดินอยู่ในโบสถ์บนหน้านี้ ผู้ที่มาไม่ได้จะยืนส่งความยินดีที่สวนด้านหน้า
          </p>
          <Ornament className="my-5" />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" className="h-12 flex-1 rounded-full text-base" onClick={onRegister}>
              {registered ? "แก้ไขการตอบรับ" : "ลงทะเบียน"}
            </Button>
            <a
              href="#venue"
              className={cn(buttonVariants({ variant: "outline" }), "h-12 flex-1 rounded-full bg-background text-base")}
            >
              กลับไปดูโบสถ์
            </a>
          </div>
          {phone && party ? (
            <p className="mt-4 text-center text-xs text-muted-foreground">บัญชีแขก {formatThaiMobile(phone)}</p>
          ) : (
            <p className="mt-4 text-center text-xs text-muted-foreground">ยังไม่ต้องกรอกเบอร์ จนกว่าจะกดลงทะเบียน</p>
          )}
        </article>

        {mine.length > 0 ? <RosterGroup title="คณะของคุณ" guests={mine} /> : null}
        {others.length > 0 ? <RosterGroup title="แขกบนเครื่องนี้" guests={others} /> : null}
        <RosterGroup
          title="แขกในฉาก"
          hint="มีแขกตัวอย่างติดมากับหน้าเว็บ เพื่อให้โบสถ์มีชีวิตตั้งแต่เปิดครั้งแรก"
          guests={samples}
        />
      </section>
    </div>
  )
}
