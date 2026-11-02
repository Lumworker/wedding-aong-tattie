"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react"
import {
  BookHeart,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  CircleDashed,
  CircleX,
  Copy,
  Heart,
  Mail,
  MapPin,
  Navigation,
  Pencil,
  Phone,
  Send,
  Shirt,
  TriangleAlert,
} from "lucide-react"
import { BalconyScene, MAX_RAIL_LETTERS, THROW_MS, type Reader, type SceneAnim } from "@/components/dashboard/balcony-scene"
import { Sheet } from "@/components/dashboard/sheet"
import { Tour, type TourStep } from "@/components/dashboard/tour"
import { googleCalendarUrl, icsDataUrl } from "@/lib/calendar"
import { CEREMONY_DATE_ISO, CEREMONY_START, COUPLE, COUPLE_STORY, DRESS_CODE, RSVP_DEADLINE_THAI, VENUE_MAP } from "@/lib/event"
import { guestStore } from "@/lib/guest-store"
import { newId } from "@/lib/id"
import { formatThaiMobile } from "@/lib/phone"
import type { Guest, Party, Wish } from "@/lib/types"
import { WISH_TEXT_MAX, clipWishText, wishGlyphCount } from "@/lib/wish"

const DIRECTIONS = `https://www.google.com/maps/dir/?api=1&destination=${VENUE_MAP.lat},${VENUE_MAP.lng}`
const TOUR_KEY = "webding-dashboard-tour-v2"
const PRESETS = ["ยินดีด้วยนะ!", "ขอให้รักกันนาน ๆ", "มีความสุขมาก ๆ นะ"]

type SheetKey = "date" | "place" | "dress" | "story" | "manage" | "cancel" | "wish" | "letters" | null

function daysUntilWedding() {
  const target = new Date(`${CEREMONY_DATE_ISO}T00:00:00+07:00`).getTime()
  return Math.max(0, Math.ceil((target - Date.now()) / 86_400_000))
}

function weekdayThai() {
  return new Date(`${CEREMONY_DATE_ISO}T12:00:00+07:00`).toLocaleDateString("th-TH", { weekday: "long", timeZone: "Asia/Bangkok" })
}

function useIsAdmin() {
  return useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).has("admin"),
    () => false
  )
}

function PixelHeart() {
  const rows = [".XX.XX.", "XXXXXXX", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."]
  return (
    <svg aria-hidden="true" width="18" height="15" viewBox="0 0 7 6" shapeRendering="crispEdges">
      {rows.flatMap((row, y) => [...row].map((c, x) => (c === "X" ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#A8834F" /> : null)))}
    </svg>
  )
}

function SolidButton({
  children,
  onClick,
  href,
  tone = "sumi",
  className = "",
}: {
  children: ReactNode
  onClick?: () => void
  href?: string
  tone?: "sumi" | "sakura"
  className?: string
}) {
  const cls = `flex min-h-[50px] items-center justify-center gap-2 rounded-md px-4 text-base font-semibold ${
    tone === "sumi" ? "bg-[#2B2621] text-[#FAF7F1] hover:bg-[#4A433C]" : "bg-[#F3ECE2] ring-1 ring-inset ring-[#D9C7A6] text-[#2B2621] hover:bg-[#EDE3D4]"
  } ${className}`
  if (href)
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    )
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  )
}

function LineButton({ children, onClick, danger = false }: { children: ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[46px] items-center justify-center gap-2 rounded-md border px-4 text-[15px] font-medium ${
        danger ? "border-[#9F3A2E] text-[#9F3A2E] hover:bg-[#FBEFEC]" : "border-[#2B2621] text-[#2B2621] hover:bg-[#FAF7F1]"
      }`}
    >
      {children}
    </button>
  )
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-[#A8834F]">{icon}</span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-[15px] text-[#2B2621]">{label}</span>
        {value ? <span className="text-[13px] leading-normal text-[#6F665C]">{value}</span> : null}
      </div>
    </div>
  )
}

export function DashboardView({
  guests,
  wishes,
  phone,
  selfKey,
  party,
  onEdit,
  onEditStep,
  onChangePhone,
  onCancelled,
}: {
  guests: Guest[]
  wishes: Wish[]
  phone: string
  selfKey: string
  party: Party
  onEdit: () => void
  onEditStep: (step: "attend" | "review") => void
  onChangePhone: () => void
  onCancelled: () => void
}) {
  const isAdmin = useIsAdmin()
  const mine = useMemo(() => guests.filter((guest) => guest.partyPhone === selfKey), [guests, selfKey])
  const mainGuest = party.guests.find((guest) => !guest.isCompanion) ?? party.guests[0]
  const attendance = mainGuest?.attendance ?? "attending"
  const declined = attendance === "declined"
  const names = useMemo(() => party.guests.filter((guest) => !guest.isCompanion).map((guest) => guest.name).filter(Boolean), [party.guests])
  const partySize = party.guests.length
  const sorted = useMemo(() => [...wishes].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [wishes])
  const railLetters = sorted.slice(0, MAX_RAIL_LETTERS)

  const [sheet, setSheet] = useState<SheetKey>(null)
  const [anim, setAnim] = useState<SceneAnim>({ kind: "idle" })
  const [letter, setLetter] = useState<Wish | null>(null)
  const [throwing, setThrowing] = useState<number | null>(null)
  const pendingLetter = useRef<Wish | null>(null)
  const landTimer = useRef<number | undefined>(undefined)
  const nextReader = useRef<Reader>("groom")
  const [tour, setTour] = useState(0)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // wish composer
  const [editingId, setEditingId] = useState<string | null>(null)
  const [from, setFrom] = useState(names[0] ?? "")
  const [text, setText] = useState("")
  const count = wishGlyphCount(text)

  const coupleRef = useRef<HTMLButtonElement>(null)
  const navRef = useRef<HTMLAnchorElement>(null)
  const wishRef = useRef<HTMLButtonElement>(null)
  const tilesRef = useRef<HTMLDivElement>(null)
  const manageRef = useRef<HTMLButtonElement>(null)

  const steps: TourStep[] = useMemo(
    () => [
      { target: coupleRef, title: "ทักทายบ่าวสาว", text: `แตะ${COUPLE.groomNickname}กับ${COUPLE.brideNickname}บนระเบียงได้เลย` },
      ...(declined ? [] : [{ target: navRef, title: "นำทางไปงาน", text: "เปิด Google Maps พาไปถึงโบสถ์" }]),
      {
        target: wishRef,
        title: "อวยพรบ่าวสาว",
        text: declined ? "ไม่ได้ไปงานก็ส่งจดหมายขึ้นไปได้" : "เขียนจดหมายแล้วปาขึ้นไปให้บ่าวสาวอ่าน",
      },
      { target: tilesRef, title: "ข้อมูลงาน", text: "กดดูวันเวลา สถานที่ การแต่งกาย และเรื่องของเรา" },
      { target: manageRef, title: "แก้ไขหรือยกเลิก", text: "กด “จัดการ” เพื่อแก้ข้อมูลคณะ เปลี่ยนเบอร์ หรือยกเลิก" },
    ],
    [declined]
  )

  useEffect(() => {
    let seen = true
    try {
      seen = window.localStorage.getItem(TOUR_KEY) === "1"
    } catch {
      seen = true
    }
    if (seen) return
    const timer = window.setTimeout(() => setTour(1), 700)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => () => window.clearTimeout(landTimer.current), [])

  const endTour = useCallback(() => {
    setTour(0)
    try {
      window.localStorage.setItem(TOUR_KEY, "1")
    } catch {
      /* private mode */
    }
  }, [])

  const closeSheet = useCallback(() => {
    setSheet(null)
    setError(null)
  }, [])

  function open(key: Exclude<SheetKey, null>) {
    setError(null)
    setSheet(key)
  }

  function read(wish: Wish) {
    const who = nextReader.current
    nextReader.current = who === "groom" ? "bride" : "groom"
    setLetter(wish)
    setAnim({ kind: "read", who, key: Date.now() })
  }

  function startWish(edit?: Wish) {
    setEditingId(edit?.id ?? null)
    setFrom(edit?.from ?? names[0] ?? "")
    setText(edit ? clipWishText(edit.text) : "")
    open("wish")
  }

  async function submitWish() {
    const nextText = clipWishText(text.trim())
    const nextFrom = from.trim()
    if (!nextText || !nextFrom || busy) return
    setBusy(true)
    setError(null)
    try {
      if (editingId) {
        const original = wishes.find((wish) => wish.id === editingId)
        if (!original) throw new Error("ไม่พบจดหมายที่จะแก้ไข")
        await guestStore.updateWish({ ...original, from: nextFrom, text: nextText })
        setSheet(null)
      } else {
        const wish: Wish = { id: newId("wish"), text: nextText, from: nextFrom, partyPhone: selfKey, createdAt: new Date().toISOString() }
        await guestStore.addWish(wish)
        pendingLetter.current = wish
        setSheet(null)
        setLetter(null)
        setAnim({ kind: "idle" })
        setThrowing(Date.now())
        window.clearTimeout(landTimer.current)
        landTimer.current = window.setTimeout(() => {
          setThrowing(null)
          if (pendingLetter.current) read(pendingLetter.current)
          pendingLetter.current = null
        }, THROW_MS + 60)
      }
      setText("")
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "ส่งจดหมายไม่สำเร็จ ลองอีกครั้งนะ")
    } finally {
      setBusy(false)
    }
  }

  async function confirmCancel() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await guestStore.deleteRegistration(party.phone)
      setSheet(null)
      onCancelled()
    } catch (err) {
      setError(err instanceof Error ? err.message : "ยกเลิกไม่สำเร็จ ลองอีกครั้งนะ")
    } finally {
      setBusy(false)
    }
  }

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(`${VENUE_MAP.name} ${VENUE_MAP.address}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const statusIcon =
    attendance === "attending" ? (
      <CircleCheck aria-hidden="true" className="size-7 shrink-0 text-[#A8834F]" />
    ) : attendance === "declined" ? (
      <CircleX aria-hidden="true" className="size-7 shrink-0 text-[#6F665C]" />
    ) : (
      <CircleDashed aria-hidden="true" className="size-7 shrink-0 text-[#6F665C]" />
    )
  const statusTitle = attendance === "attending" ? "ไปร่วมงาน" : attendance === "declined" ? "ไม่ไปร่วมงาน" : "ยังไม่แน่ใจ"
  const others = Math.max(0, partySize - 1)
  const statusSub =
    attendance === "attending"
      ? `${partySize} ท่าน · ${mainGuest?.name ?? ""}${others ? ` +${others}` : ""}`
      : attendance === "declined"
        ? "ยังอวยพรบ่าวสาวได้นะ"
        : RSVP_DEADLINE_THAI
          ? `ยืนยันได้ถึง ${RSVP_DEADLINE_THAI}`
          : "แตะ “จัดการ” เพื่ออัปเดตคำตอบ"

  const calendarDetails = `${COUPLE.dateThai} · ${VENUE_MAP.name} ${VENUE_MAP.address}`
  const tileClass =
    "flex h-[78px] flex-col items-center justify-center gap-1.5 rounded-md border border-[#E6DED0] bg-white text-[13px] font-medium text-[#2B2621] hover:bg-[#FBF9F5]"

  return (
    <div className="flex h-dvh flex-col bg-[#FAF7F1] font-sans text-[#2B2621] lg:grid lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)]">
      <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-[#E6DED0] pr-1.5 pl-4 lg:col-start-1 lg:row-start-1 lg:h-auto lg:border-r lg:py-4">
        <div className="flex items-center gap-2">
          <PixelHeart />
          <h1 className="font-serif text-[19px] font-semibold">
            {COUPLE.groomNickname} &amp; {COUPLE.brideNickname}
          </h1>
        </div>
        <div className="flex items-center gap-0.5">
          <span className="flex items-center gap-1.5 rounded-full bg-[#F3ECE2] px-2.5 py-1.5 text-[13px] font-medium">
            <CalendarDays aria-hidden="true" className="size-[15px]" />
            อีก {daysUntilWedding()} วัน
          </span>
          <button
            type="button"
            onClick={() => {
              setSheet(null)
              setTour(1)
            }}
            aria-label="วิธีใช้งาน"
            title="วิธีใช้งาน"
            className="flex size-11 items-center justify-center rounded-md hover:bg-[#F3ECE2]"
          >
            <span className="flex size-[26px] items-center justify-center rounded-full border border-[#2B2621] text-[13px] font-semibold">?</span>
          </button>
        </div>
      </header>

      <section
        aria-label="ฉากระเบียงของบ่าวสาว"
        className="mx-3.5 mt-2 min-h-[220px] flex-1 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:m-4 lg:min-h-0"
      >
        <BalconyScene
          guests={guests}
          selfKey={selfKey}
          declined={declined}
          letters={railLetters}
          anim={anim}
          letter={letter}
          throwing={throwing}
          coupleRef={coupleRef}
          onCoupleTap={() => {
            setLetter(null)
            setAnim({ kind: "wave", key: Date.now() })
          }}
          onWaveDone={() => setAnim((current) => (current.kind === "wave" ? { kind: "idle" } : current))}
          onLetterTap={read}
          onCloseLetter={() => {
            setLetter(null)
            setAnim({ kind: "idle" })
          }}
        />
      </section>

      <div className="shrink-0 lg:col-start-1 lg:row-start-2 lg:overflow-y-auto lg:border-r lg:border-[#E6DED0] lg:pb-6">
        <div className="mx-3.5 mt-2.5 flex h-16 items-center gap-2.5 rounded-lg border border-[#E6DED0] bg-white px-3">
          {statusIcon}
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="font-serif text-lg leading-tight font-semibold">{statusTitle}</span>
            <span className="truncate text-xs text-[#6F665C]">{statusSub}</span>
          </div>
          <button
            ref={manageRef}
            type="button"
            onClick={() => open("manage")}
            className="flex min-h-11 items-center gap-1.5 rounded-md border border-[#2B2621] px-3.5 text-sm font-medium hover:bg-[#FAF7F1]"
          >
            <Pencil aria-hidden="true" className="size-4" />
            จัดการ
          </button>
        </div>

        <div className={`mx-3.5 mt-3 grid gap-2.5 ${declined ? "grid-cols-1" : "grid-cols-2"}`}>
          {declined ? null : (
            <a
              ref={navRef}
              href={DIRECTIONS}
              target="_blank"
              rel="noopener noreferrer"
              className="grid h-16 grid-cols-[auto_1fr] items-center gap-x-2.5 rounded-lg bg-[#2B2621] px-3.5 text-[#FAF7F1] hover:bg-[#4A433C]"
            >
              <Navigation aria-hidden="true" className="row-span-2 size-6" />
              <span className="self-end text-base leading-tight font-semibold">นำทางไปงาน</span>
              <span className="self-start text-xs leading-tight opacity-85">Google Maps</span>
            </a>
          )}
          <button
            ref={wishRef}
            type="button"
            onClick={() => startWish()}
            className="grid h-16 grid-cols-[auto_1fr] items-center gap-x-2.5 rounded-lg bg-[#F3ECE2] ring-1 ring-inset ring-[#D9C7A6] px-3.5 text-left text-[#2B2621] hover:bg-[#EDE3D4]"
          >
            <Heart aria-hidden="true" className="row-span-2 size-6" />
            <span className="self-end text-base leading-tight font-semibold">{declined ? "อวยพรบ่าวสาว" : "อวยพร"}</span>
            <span className="self-start text-xs leading-tight opacity-85">ปาจดหมายขึ้นไป</span>
          </button>
        </div>

        <div ref={tilesRef} className="mx-3.5 mt-3 grid grid-cols-4 gap-2">
          <button type="button" className={tileClass} onClick={() => open("date")}>
            <CalendarDays aria-hidden="true" className="size-6 text-[#A8834F]" />
            วันงาน
          </button>
          <button type="button" className={tileClass} onClick={() => open("place")}>
            <MapPin aria-hidden="true" className="size-6 text-[#A8834F]" />
            สถานที่
          </button>
          <button type="button" className={tileClass} onClick={() => open("dress")}>
            <Shirt aria-hidden="true" className="size-6 text-[#A8834F]" />
            แต่งกาย
          </button>
          <button type="button" className={tileClass} onClick={() => open("story")}>
            <BookHeart aria-hidden="true" className="size-6 text-[#A8834F]" />
            เรื่องของเรา
          </button>
        </div>

        <button
          type="button"
          onClick={() => open("letters")}
          className="mx-3.5 mt-3 mb-[max(env(safe-area-inset-bottom),0.875rem)] flex h-12 w-[calc(100%-1.75rem)] items-center gap-2.5 rounded-md border border-dashed border-[#C9B48E] px-3.5 text-sm hover:bg-white"
        >
          <Mail aria-hidden="true" className="size-[19px] text-[#A8834F]" />
          <span className="flex-1 text-left">จดหมายถึงบ่าวสาว · {wishes.length}</span>
          <ChevronRight aria-hidden="true" className="size-[18px] text-[#6F665C]" />
        </button>
      </div>

      {/* ---------- sheets ---------- */}
      <Sheet open={sheet === "date"} title="วันงาน" onClose={closeSheet}>
        <p className="font-serif text-[22px] font-semibold">
          {weekdayThai()} {COUPLE.dateThai}
        </p>
        <InfoRow
          icon={<CalendarDays aria-hidden="true" className="size-[18px]" />}
          label={CEREMONY_START ? `เริ่มพิธี ${CEREMONY_START} น.` : "เวลาเริ่มพิธี"}
          value={CEREMONY_START ? "กรุณามาถึงก่อนเริ่มประมาณ 30 นาที" : "จะแจ้งให้ทราบเร็ว ๆ นี้"}
        />
        {RSVP_DEADLINE_THAI ? <InfoRow icon={<Pencil aria-hidden="true" className="size-[18px]" />} label={`ตอบรับได้ถึง ${RSVP_DEADLINE_THAI}`} /> : null}
        <div className="grid grid-cols-2 gap-2">
          <SolidButton href={googleCalendarUrl(calendarDetails)}>Google Calendar</SolidButton>
          <a
            href={icsDataUrl(calendarDetails)}
            download="wedding-aong-tattie.ics"
            className="flex min-h-[50px] items-center justify-center rounded-md border border-[#2B2621] text-[15px] font-medium hover:bg-[#FAF7F1]"
          >
            iPhone / Outlook
          </a>
        </div>
      </Sheet>

      <Sheet open={sheet === "place"} title="สถานที่" onClose={closeSheet}>
        <div className="overflow-hidden rounded-lg border border-[#E6DED0]">
          <iframe
            title={`แผนที่${VENUE_MAP.name}`}
            src={VENUE_MAP.embed}
            className="h-44 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div>
          <p className="text-[17px] font-semibold">
            {VENUE_MAP.name} <span className="font-normal text-[#6F665C]">· {VENUE_MAP.nameEn}</span>
          </p>
          <p className="text-[13px] leading-normal text-[#6F665C]">{VENUE_MAP.address}</p>
        </div>
        <div className="grid grid-cols-[1fr_50px] gap-2">
          <SolidButton href={DIRECTIONS}>
            <Navigation aria-hidden="true" className="size-[19px]" />
            นำทาง Google Maps
          </SolidButton>
          <button
            type="button"
            onClick={copyAddress}
            aria-label={copied ? "คัดลอกที่อยู่แล้ว" : "คัดลอกที่อยู่"}
            title="คัดลอกที่อยู่"
            className="flex h-[50px] items-center justify-center rounded-md border border-[#2B2621] hover:bg-[#FAF7F1]"
          >
            {copied ? <CircleCheck aria-hidden="true" className="size-[19px] text-[#A8834F]" /> : <Copy aria-hidden="true" className="size-[19px]" />}
          </button>
        </div>
        <p role="status" className="-mt-1.5 h-4 text-xs text-[#6F665C]">
          {copied ? "คัดลอกที่อยู่แล้ว" : ""}
        </p>
      </Sheet>

      <Sheet open={sheet === "dress"} title="การแต่งกาย" onClose={closeSheet}>
        <InfoRow icon={<Shirt aria-hidden="true" className="size-[18px]" />} label={DRESS_CODE.title.replace("การแต่งกาย: ", "")} value={DRESS_CODE.detail} />
      </Sheet>

      <Sheet open={sheet === "story"} title="เรื่องของเรา" onClose={closeSheet}>
        <p className="text-[15px] leading-relaxed">{COUPLE_STORY.lead}</p>
        <div>
          <p className="font-serif text-base font-semibold">{COUPLE.groomNickname}</p>
          <p className="text-sm leading-relaxed text-[#4A433C]">{COUPLE_STORY.groom}</p>
        </div>
        <div>
          <p className="font-serif text-base font-semibold">{COUPLE.brideNickname}</p>
          <p className="text-sm leading-relaxed text-[#4A433C]">{COUPLE_STORY.bride}</p>
        </div>
        <p className="text-sm leading-relaxed text-[#4A433C]">{COUPLE_STORY.together}</p>
      </Sheet>

      <Sheet open={sheet === "manage"} title="จัดการการลงทะเบียน" onClose={closeSheet}>
        <p className="-mt-2 text-[13px] text-[#6F665C]">
          {formatThaiMobile(phone)} · {mine.length || partySize} ท่าน
        </p>
        <div className="flex flex-col">
          {[
            { label: "แก้ไขข้อมูลคณะ", icon: <Pencil aria-hidden="true" className="size-5" />, onClick: onEdit, danger: false },
            { label: "เปลี่ยนเบอร์โทรศัพท์", icon: <Phone aria-hidden="true" className="size-5" />, onClick: onChangePhone, danger: false },
            { label: "ยกเลิกการลงทะเบียน", icon: <CircleX aria-hidden="true" className="size-5" />, onClick: () => open("cancel"), danger: true },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className={`flex min-h-[54px] items-center gap-3 border-t border-[#E6DED0] px-1 text-left text-[15px] hover:bg-[#FBF9F5] ${
                item.danger ? "text-[#9F3A2E]" : "text-[#2B2621]"
              }`}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              <ChevronRight aria-hidden="true" className="size-[18px] text-[#6F665C]" />
            </button>
          ))}
        </div>
        {isAdmin ? (
          <p className="text-xs text-[#6F665C]">
            แอดมิน · เข้าร่วม {guests.filter((g) => g.attendance === "attending").length} · ยังไม่แน่ใจ{" "}
            {guests.filter((g) => g.attendance === "unsure").length} · ไปไม่ได้ {guests.filter((g) => g.attendance === "declined").length}
          </p>
        ) : null}
      </Sheet>

      <Sheet open={sheet === "cancel"} title="ยกเลิกการลงทะเบียน?" onClose={closeSheet} tone="danger">
        <div className="flex gap-2.5">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#9F3A2E]" />
          <p className="text-sm leading-relaxed">
            ข้อมูลคณะทั้ง {partySize} ท่านจะถูกลบ ถ้าแค่ไปไม่ได้ เลือก “ไม่ไปร่วมงาน” แทนได้ ยังอวยพรได้เหมือนเดิม
          </p>
        </div>
        {declined ? null : (
          <SolidButton tone="sakura" onClick={() => onEditStep("attend")}>
            เปลี่ยนเป็นไม่ไปร่วมงาน
          </SolidButton>
        )}
        <LineButton danger onClick={confirmCancel}>
          <CircleX aria-hidden="true" className="size-[18px]" />
          {busy ? "กำลังยกเลิก…" : "ยืนยันยกเลิก"}
        </LineButton>
        {error ? (
          <p role="alert" className="text-sm text-[#9F3A2E]">
            {error}
          </p>
        ) : null}
      </Sheet>

      <Sheet open={sheet === "wish"} title={editingId ? "แก้ไขจดหมาย" : "อวยพรบ่าวสาว"} onClose={closeSheet}>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setText((current) => clipWishText(current ? `${current} ${preset}` : preset))}
              className="min-h-9 rounded-full border border-[#C9B48E] px-3 text-[13px] hover:bg-[#F6F1E8]"
            >
              {preset}
            </button>
          ))}
        </div>
        <label htmlFor="wish-text" className="sr-only">
          ข้อความถึงบ่าวสาว
        </label>
        <textarea
          id="wish-text"
          value={text}
          onChange={(event) => setText(clipWishText(event.target.value))}
          placeholder={`เขียนจดหมายถึง${COUPLE.groomNickname}กับ${COUPLE.brideNickname}…`}
          rows={4}
          className="w-full resize-none rounded-md border border-[#2B2621] bg-white p-3 text-base leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-[#A8834F]"
        />
        <div className="-mt-2 flex items-center justify-between gap-2 text-xs text-[#6F665C]">
          {names.length > 1 ? (
            <label className="flex items-center gap-1.5">
              ลงชื่อ
              <select
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="min-h-9 rounded-md border border-[#E6DED0] bg-white px-2 text-[13px] text-[#2B2621]"
              >
                {names.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <span>ลงชื่อ: {from || "—"}</span>
          )}
          <span aria-live="polite">
            {count}/{WISH_TEXT_MAX}
          </span>
        </div>
        <SolidButton onClick={submitWish} className={!text.trim() || busy ? "pointer-events-none opacity-50" : ""}>
          <Send aria-hidden="true" className="size-[19px]" />
          {busy ? "กำลังส่ง…" : editingId ? "บันทึกการแก้ไข" : "ปาจดหมายขึ้นไป"}
        </SolidButton>
        {error ? (
          <p role="alert" className="text-sm text-[#9F3A2E]">
            {error}
          </p>
        ) : null}
      </Sheet>

      <Sheet open={sheet === "letters"} title="จดหมายถึงบ่าวสาว" onClose={closeSheet}>
        {sorted.length === 0 ? <p className="text-sm text-[#6F665C]">ยังไม่มีจดหมาย เป็นคนแรกเลยไหม</p> : null}
        <ul className="flex flex-col gap-2">
          {sorted.map((wish) => (
            <li key={wish.id} className="rounded-md border border-[#E6DED0] bg-white px-3.5 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold">{wish.from}</p>
                {wish.partyPhone === selfKey ? (
                  <button type="button" onClick={() => startWish(wish)} className="min-h-9 px-1 text-[13px] text-[#86663A] underline underline-offset-2">
                    แก้ไข
                  </button>
                ) : null}
              </div>
              <p className="mt-0.5 text-sm leading-relaxed break-words whitespace-pre-line">{wish.text}</p>
            </li>
          ))}
        </ul>
        <SolidButton tone="sakura" onClick={() => startWish()}>
          <Heart aria-hidden="true" className="size-[19px]" />
          เขียนจดหมายของคุณ
        </SolidButton>
      </Sheet>

      <Tour steps={steps} step={tour} onNext={() => (tour >= steps.length ? endTour() : setTour(tour + 1))} onSkip={endTour} />
    </div>
  )
}
