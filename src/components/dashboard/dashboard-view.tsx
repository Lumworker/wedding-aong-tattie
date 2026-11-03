"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react"
import Link from "next/link"
import {
  BookHeart,
  CalendarDays,
  ChevronRight,
  CircleCheck,
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
import { BalconyScene, THROW_MS, type Reader, type SceneAnim } from "@/components/dashboard/balcony-scene"
import { Sheet } from "@/components/dashboard/sheet"
import { Tour, type TourStep } from "@/components/dashboard/tour"
import { googleCalendarUrl, icsDataUrl } from "@/lib/calendar"
import { CEREMONY_DATE_ISO, CEREMONY_START, COUPLE, COUPLE_STORY, DRESS_CODE, RSVP_DEADLINE_THAI, VENUE_MAP } from "@/lib/event"
import { guestStore } from "@/lib/guest-store"
import { newId } from "@/lib/id"
import { ROUTES, withQuery } from "@/lib/routes"
import { formatThaiMobile } from "@/lib/phone"
import type { Guest, Party, Wish } from "@/lib/types"
import { WISH_TEXT_MAX, clipWishText, wishGlyphCount } from "@/lib/wish"

const DIRECTIONS = `https://www.google.com/maps/dir/?api=1&destination=${VENUE_MAP.lat},${VENUE_MAP.lng}`
/** The walkthrough comes back whenever this cookie has expired (10 hours). */
const TOUR_COOKIE = "dash_tour_seen"
const TOUR_TTL_S = 10 * 60 * 60
/** How long a letter note stays up, and the gap between auto reads. */
const READ_HOLD_MS = 4600
const AUTO_READ_MS = 6500

function tourSeen() {
  try {
    return document.cookie.split("; ").some((part) => part.startsWith(`${TOUR_COOKIE}=`))
  } catch {
    return true
  }
}

function markTourSeen() {
  try {
    document.cookie = `${TOUR_COOKIE}=1; max-age=${TOUR_TTL_S}; path=/; SameSite=Lax`
  } catch {
    /* cookies blocked */
  }
}
const PRESETS = ["ยินดีด้วยนะ!", "ขอให้รักกันนาน ๆ", "มีความสุขมาก ๆ นะ"]

type SheetKey = "date" | "place" | "dress" | "story" | "manage" | "cancel" | "wish" | "letters" | "letter" | null

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
  const cls = `flex min-h-[50px] items-center justify-center gap-2 rounded-full px-4 text-base font-medium ${
    tone === "sumi" ? "bg-[#2E4535] text-[#F6F1E8] hover:bg-[#22352A]" : "bg-[#F2D9D3] text-[#2E4535] hover:bg-[#EBC9C1]"
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
      className={`flex min-h-[46px] items-center justify-center gap-2 rounded-full border px-4 text-[15px] font-medium ${
        danger ? "border-[#9A3B2E] text-[#9A3B2E] hover:bg-[#F8ECE8]" : "border-[#2E4535] text-[#2E4535] hover:bg-[#F6F1E8]"
      }`}
    >
      {children}
    </button>
  )
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-[#5F7290]">{icon}</span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-[15px] text-[#2E4535]">{label}</span>
        {value ? <span className="text-[13px] leading-normal text-[#5B6B5F]">{value}</span> : null}
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
  composeOnOpen = false,
  onComposeOpened,
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
  /** Open the letter composer right away (deep link from the about pages). */
  composeOnOpen?: boolean
  onComposeOpened?: () => void
}) {
  const isAdmin = useIsAdmin()
  const mine = useMemo(() => guests.filter((guest) => guest.partyPhone === selfKey), [guests, selfKey])
  const mainGuest = party.guests.find((guest) => !guest.isCompanion) ?? party.guests[0]
  const attendance = mainGuest?.attendance ?? "attending"
  const declined = attendance === "declined"
  const names = useMemo(() => party.guests.filter((guest) => !guest.isCompanion).map((guest) => guest.name).filter(Boolean), [party.guests])
  const partySize = party.guests.length
  const sorted = useMemo(() => [...wishes].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [wishes])

  const [sheet, setSheet] = useState<SheetKey>(composeOnOpen ? "wish" : null)
  const [anim, setAnim] = useState<SceneAnim>({ kind: "idle" })
  const [letter, setLetter] = useState<Wish | null>(null)
  const [throwing, setThrowing] = useState<number | null>(null)
  const [shown, setShown] = useState<Wish | null>(null)
  const pendingLetter = useRef<Wish | null>(null)
  const landTimer = useRef<number | undefined>(undefined)
  const holdTimer = useRef<number | undefined>(undefined)
  const autoIndex = useRef(0)
  const nextReader = useRef<Reader>("groom")
  const [tour, setTour] = useState(0)
  const [waved, setWaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // wish composer
  const [editingId, setEditingId] = useState<string | null>(null)
  const [from, setFrom] = useState(names[0] ?? "")
  const [text, setText] = useState("")
  const count = wishGlyphCount(text)

  const coupleRef = useRef<HTMLButtonElement>(null)
  const lettersRef = useRef<HTMLButtonElement>(null)
  const wishRef = useRef<HTMLButtonElement>(null)
  const tilesRef = useRef<HTMLDivElement>(null)
  const manageRef = useRef<HTMLButtonElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)

  const steps: TourStep[] = useMemo(
    () => [
      {
        target: coupleRef,
        title: `ทักทาย${COUPLE.groomNickname}กับ${COUPLE.brideNickname}`,
        text: "แตะที่บ่าวสาว ทั้งคู่จะโบกมือทักคุณ",
        icon: <Heart className="size-4" />,
        radius: 16,
        tapToContinue: true,
      },
      {
        target: wishRef,
        title: "เขียนจดหมายถึงบ่าวสาว",
        text: declined
          ? "ไม่ได้ไปงานก็ส่งจดหมายได้ ทั้งคู่จะหยิบขึ้นมาอ่านในฉากนี้"
          : "ส่งคำอวยพร แล้วจดหมายจะลอยไปหาบ่าวสาว ทั้งคู่จะหยิบขึ้นมาอ่านในฉากนี้",
        icon: <Mail className="size-4" />,
        radius: 999,
      },
      {
        target: statusRef,
        title: "แก้คำตอบได้ตลอด",
        text: "กด “จัดการ” เพื่อแก้ข้อมูลคณะ เปลี่ยนเบอร์ หรือยกเลิกการลงทะเบียน",
        icon: <Pencil className="size-4" />,
        radius: 18,
      },
    ],
    [declined]
  )

  useEffect(() => {
    if (tourSeen()) return
    const timer = window.setTimeout(() => startTour(), 700)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(
    () => () => {
      window.clearTimeout(landTimer.current)
      window.clearTimeout(holdTimer.current)
    },
    []
  )

  // A letter note would sit under the coach card, so the scene goes quiet first.
  function startTour() {
    window.clearTimeout(holdTimer.current)
    setLetter(null)
    setAnim({ kind: "idle" })
    setTour(1)
  }

  const endTour = useCallback(() => {
    setTour(0)
    markTourSeen()
  }, [])

  const closeSheet = useCallback(() => {
    setSheet(null)
    setError(null)
  }, [])

  function open(key: Exclude<SheetKey, null>) {
    setError(null)
    setSheet(key)
  }

  const read = useCallback((wish: Wish) => {
    const who = nextReader.current
    nextReader.current = who === "groom" ? "bride" : "groom"
    setLetter(wish)
    setAnim({ kind: "read", who, key: Date.now() })
    window.clearTimeout(holdTimer.current)
    holdTimer.current = window.setTimeout(() => {
      setLetter(null)
      setAnim((current) => (current.kind === "read" ? { kind: "idle" } : current))
    }, READ_HOLD_MS)
  }, [])

  // The couple keep reading letters on their own while nothing else is going on.
  const idle = sheet === null && tour === 0 && throwing === null && anim.kind === "idle"
  useEffect(() => {
    if (!idle || sorted.length === 0) return
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return
    const timer = window.setTimeout(() => {
      if (document.hidden) return
      const wish = sorted[autoIndex.current % sorted.length]
      autoIndex.current += 1
      read(wish)
    }, autoIndex.current === 0 ? 1200 : AUTO_READ_MS)
    return () => window.clearTimeout(timer)
  }, [idle, sorted, read])

  function openLetter(wish: Wish) {
    setShown(wish)
    open("letter")
  }

  function startWish(edit?: Wish) {
    setEditingId(edit?.id ?? null)
    setFrom(edit?.from ?? names[0] ?? "")
    setText(edit ? clipWishText(edit.text) : "")
    open("wish")
  }

  // The composer opened from the first render (see `sheet` above); now drop ?compose from the URL.
  useEffect(() => {
    if (composeOnOpen) onComposeOpened?.()
    // only on arrival
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const statusTitle = attendance === "attending" ? `ไปร่วมงาน · ${partySize} ท่าน` : attendance === "declined" ? "ไม่ไปร่วมงาน" : "ยังไม่แน่ใจ"
  const others = Math.max(0, partySize - 1)
  const statusSub =
    attendance === "attending"
      ? `คุณ${mainGuest?.name ?? ""}${others ? ` +${others}` : ""} · ยืนยันแล้ว`
      : attendance === "declined"
        ? "ยังส่งจดหมายถึงบ่าวสาวได้นะ"
        : RSVP_DEADLINE_THAI
          ? `ยืนยันได้ถึง ${RSVP_DEADLINE_THAI}`
          : "แตะ “จัดการ” เพื่ออัปเดตคำตอบ"

  const calendarDetails = `${COUPLE.dateThai} · ${VENUE_MAP.name} ${VENUE_MAP.address}`
  const days = daysUntilWedding()
  const tileClass =
    "flex h-[60px] flex-col items-center justify-center gap-1 rounded-[14px] border border-[#E6DCC4] bg-[#FFFCF5] text-xs text-[#2E4535] hover:bg-[#FFF8E6]"

  return (
    <div className="flex h-dvh flex-col bg-[#F6F1E8] font-sans text-[#2E4535] lg:grid lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)]">
      <header className="flex h-16 shrink-0 items-center justify-between pr-1.5 pl-4 lg:col-start-1 lg:row-start-1 lg:h-auto lg:border-r lg:border-[#E6DCC4] lg:py-4">
        <h1 className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/script-rose.webp?v=1" alt="" width={103} height={56} className="-ml-1 h-14 w-auto" draggable={false} />
          <span className="sr-only">
            {COUPLE.groomNickname} และ {COUPLE.brideNickname}
          </span>
        </h1>
        <div className="flex items-center gap-0.5">
          <span className="rounded-full border border-[#E6DCC4] bg-[#FFF8E6] px-2.5 py-1 text-xs">อีก {days} วัน</span>
          <button
            type="button"
            onClick={() => {
              setSheet(null)
              startTour()
            }}
            aria-label="วิธีใช้งาน"
            title="วิธีใช้งาน"
            className="flex size-11 items-center justify-center rounded-full hover:bg-[#FFF8E6]"
          >
            <span className="flex size-[26px] items-center justify-center rounded-full border border-[#2E4535] text-[13px]">?</span>
          </button>
        </div>
      </header>

      <section
        aria-label="ฉากบ่าวสาว"
        className="mx-3.5 max-h-[440px] min-h-[240px] flex-1 lg:col-start-2 lg:max-h-none lg:row-span-2 lg:row-start-1 lg:m-4 lg:min-h-0"
      >
        <BalconyScene
          guests={guests}
          selfKey={selfKey}
          declined={declined}
          letterCount={wishes.length}
          anim={anim}
          letter={letter}
          throwing={throwing}
          showHint={!waved && tour === 0}
          coupleRef={coupleRef}
          lettersRef={lettersRef}
          onCoupleTap={() => {
            window.clearTimeout(holdTimer.current)
            setLetter(null)
            setWaved(true)
            setAnim({ kind: "wave", key: Date.now() })
          }}
          onWaveDone={() => setAnim((current) => (current.kind === "wave" ? { kind: "idle" } : current))}
          onOpenLetters={() => open("letters")}
          onOpenLetter={openLetter}
        />
      </section>

      <div className="shrink-0 pb-[max(env(safe-area-inset-bottom),0.875rem)] lg:col-start-1 lg:row-start-2 lg:overflow-y-auto lg:border-r lg:border-[#E6DCC4] lg:pb-6">
        <div ref={statusRef} className="relative z-10 mx-6 -mt-5 flex items-center gap-2.5 rounded-[18px] border border-[#E6DCC4] bg-[#FFFCF5] py-2.5 pr-2.5 pl-3.5 lg:mx-3.5 lg:mt-2">
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-[15px] leading-tight font-medium">{statusTitle}</span>
            <span className="truncate text-xs text-[#5B6B5F]">{statusSub}</span>
          </div>
          <button
            ref={manageRef}
            type="button"
            onClick={() => open("manage")}
            className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-[#2E4535] px-4 text-[13px] hover:bg-[#F6F1E8]"
          >
            จัดการ
          </button>
        </div>

        <button
          ref={wishRef}
          type="button"
          onClick={() => startWish()}
          className="mx-3.5 mt-3.5 flex h-[52px] w-[calc(100%-1.75rem)] items-center justify-center rounded-full bg-[#2E4535] text-[15px] font-medium text-[#F6F1E8] hover:bg-[#22352A]"
        >
          เขียนจดหมายถึงบ่าวสาว
        </button>

        <div ref={tilesRef} className="mx-3.5 mt-2.5 grid grid-cols-4 gap-1.5">
          <button type="button" className={tileClass} onClick={() => open("date")}>
            <CalendarDays aria-hidden="true" className="size-5" />
            วันงาน
          </button>
          <button type="button" className={tileClass} onClick={() => open("place")}>
            <MapPin aria-hidden="true" className="size-5" />
            สถานที่
          </button>
          <button type="button" className={tileClass} onClick={() => open("dress")}>
            <Shirt aria-hidden="true" className="size-5" />
            แต่งกาย
          </button>
          <button type="button" className={tileClass} onClick={() => open("story")}>
            <BookHeart aria-hidden="true" className="size-5" />
            บ่าวสาว
          </button>
        </div>
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
            className="flex min-h-[50px] items-center justify-center rounded-full border border-[#2E4535] text-[15px] font-medium hover:bg-[#F6F1E8]"
          >
            iPhone / Outlook
          </a>
        </div>
      </Sheet>

      <Sheet open={sheet === "place"} title="สถานที่" onClose={closeSheet}>
        <div className="overflow-hidden rounded-2xl border border-[#E6DCC4]">
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
            {VENUE_MAP.name} <span className="font-normal text-[#5B6B5F]">· {VENUE_MAP.nameEn}</span>
          </p>
          <p className="text-[13px] leading-normal text-[#5B6B5F]">{VENUE_MAP.address}</p>
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
            className="flex h-[50px] items-center justify-center rounded-full border border-[#2E4535] hover:bg-[#F6F1E8]"
          >
            {copied ? <CircleCheck aria-hidden="true" className="size-[19px] text-[#5F7290]" /> : <Copy aria-hidden="true" className="size-[19px]" />}
          </button>
        </div>
        <p role="status" className="-mt-1.5 h-4 text-xs text-[#5B6B5F]">
          {copied ? "คัดลอกที่อยู่แล้ว" : ""}
        </p>
      </Sheet>

      <Sheet open={sheet === "dress"} title="การแต่งกาย" onClose={closeSheet}>
        <InfoRow icon={<Shirt aria-hidden="true" className="size-[18px]" />} label={DRESS_CODE.title.replace("การแต่งกาย: ", "")} value={DRESS_CODE.detail} />
      </Sheet>

      <Sheet open={sheet === "story"} title="เกี่ยวกับบ่าวสาว" onClose={closeSheet}>
        <p className="-mt-2 text-[13px] text-[#5B6B5F]">แตะเพื่อไปทำความรู้จักทีละคน</p>
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href={withQuery(ROUTES.aboutAong)}
            className="relative flex h-[236px] flex-col items-center justify-end overflow-hidden rounded-[20px] bg-[#1F2E25] pb-3.5"
            style={{
              backgroundImage: "linear-gradient(rgba(138,157,181,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(138,157,181,.18) 1px,transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          >
            <span aria-hidden="true" className="absolute top-2.5 left-3 font-mono text-[11px] text-[#8A9DB5]">&lt;groom /&gt;</span>
            <span aria-hidden="true" className="absolute top-9 left-1/2 size-32 -translate-x-1/2 rounded-full border-[1.5px] border-dashed border-[#8A9DB5]" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sprites/groom.png?v=6" alt="" width={150} height={150} className="relative -mb-1.5 size-[150px]" style={{ imageRendering: "pixelated" }} draggable={false} />
            <span className="relative font-serif text-[22px] font-semibold text-[#FFF8E6]">{COUPLE.groomLatin}</span>
            <span className="relative text-[13px] text-[#CCCDB0]">{COUPLE.groomNickname} · เจ้าบ่าว</span>
          </Link>
          <Link href={withQuery(ROUTES.aboutTattie)} className="relative flex h-[236px] flex-col items-center justify-end overflow-hidden rounded-[20px] bg-[#F2D9D3] pb-3.5">
            <span aria-hidden="true" className="absolute top-3.5 left-3.5 h-11 w-[60px] -rotate-8 bg-[#FFFCF5] shadow-[0_1px_2px_rgba(46,69,53,.18)]" />
            <span aria-hidden="true" className="absolute top-[22px] right-3 h-10 w-[52px] rotate-7 bg-[#FFF8E6] shadow-[0_1px_2px_rgba(46,69,53,.18)]" />
            <span aria-hidden="true" className="absolute top-9 left-1/2 size-32 -translate-x-1/2 rounded-full bg-[#FFFCF5]" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sprites/bride.png?v=6" alt="" width={150} height={150} className="relative -mb-1.5 size-[150px]" style={{ imageRendering: "pixelated" }} draggable={false} />
            <span className="relative font-serif text-[22px] font-semibold text-[#A8665A] italic">{COUPLE.brideLatin}</span>
            <span className="relative text-[13px] text-[#2E4535]">{COUPLE.brideNickname} · เจ้าสาว</span>
          </Link>
        </div>
        <p className="text-sm leading-relaxed text-[#22352A]">{COUPLE_STORY.lead}</p>
      </Sheet>

      <Sheet open={sheet === "manage"} title="จัดการการลงทะเบียน" onClose={closeSheet}>
        <p className="-mt-2 text-[13px] text-[#5B6B5F]">
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
              className={`flex min-h-[54px] items-center gap-3 border-t border-[#E6DCC4] px-1 text-left text-[15px] hover:bg-[#FFF8E6] ${
                item.danger ? "text-[#9A3B2E]" : "text-[#2E4535]"
              }`}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              <ChevronRight aria-hidden="true" className="size-[18px] text-[#5B6B5F]" />
            </button>
          ))}
        </div>
        {isAdmin ? (
          <p className="text-xs text-[#5B6B5F]">
            แอดมิน · เข้าร่วม {guests.filter((g) => g.attendance === "attending").length} · ยังไม่แน่ใจ{" "}
            {guests.filter((g) => g.attendance === "unsure").length} · ไปไม่ได้ {guests.filter((g) => g.attendance === "declined").length}
          </p>
        ) : null}
      </Sheet>

      <Sheet open={sheet === "cancel"} title="ยกเลิกการลงทะเบียน?" onClose={closeSheet} tone="danger">
        <div className="flex gap-2.5">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#9A3B2E]" />
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
          <p role="alert" className="text-sm text-[#9A3B2E]">
            {error}
          </p>
        ) : null}
      </Sheet>

      <Sheet open={sheet === "wish"} title={editingId ? "แก้ไขจดหมาย" : "เขียนจดหมายถึงบ่าวสาว"} onClose={closeSheet}>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setText((current) => clipWishText(current ? `${current} ${preset}` : preset))}
              className="min-h-9 rounded-full border border-[#E0AFA6] px-3 text-[13px] hover:bg-[#F8ECE8]"
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
          className="w-full resize-none rounded-2xl border border-[#CCCDB0] bg-white p-3 text-base leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-[#8A9DB5]"
        />
        <div className="-mt-2 flex items-center justify-between gap-2 text-xs text-[#5B6B5F]">
          {names.length > 1 ? (
            <label className="flex items-center gap-1.5">
              ลงชื่อ
              <select
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="min-h-9 rounded-md border border-[#E6DCC4] bg-white px-2 text-[13px] text-[#2E4535]"
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
          {busy ? "กำลังส่ง…" : editingId ? "บันทึกการแก้ไข" : "ส่งจดหมายขึ้นไป"}
        </SolidButton>
        {error ? (
          <p role="alert" className="text-sm text-[#9A3B2E]">
            {error}
          </p>
        ) : null}
      </Sheet>

      <Sheet open={sheet === "letter"} title={shown ? `จดหมายจาก ${shown.from}` : "จดหมาย"} onClose={closeSheet}>
        <p className="text-base leading-relaxed break-words whitespace-pre-line">{shown?.text}</p>
        {shown && shown.partyPhone === selfKey ? (
          <LineButton onClick={() => startWish(shown)}>
            <Pencil aria-hidden="true" className="size-[18px]" />
            แก้ไขจดหมายของคุณ
          </LineButton>
        ) : null}
        <SolidButton tone="sakura" onClick={() => open("letters")}>
          ดูจดหมายทั้งหมด · {wishes.length}
        </SolidButton>
      </Sheet>

      <Sheet open={sheet === "letters"} title="จดหมายถึงบ่าวสาว" onClose={closeSheet}>
        {sorted.length === 0 ? <p className="text-sm text-[#5B6B5F]">ยังไม่มีจดหมาย เป็นคนแรกเลยไหม</p> : null}
        <ul className="flex flex-col gap-2">
          {sorted.map((wish) => (
            <li key={wish.id} className="rounded-2xl border border-[#E6DCC4] bg-white px-3.5 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold">{wish.from}</p>
                {wish.partyPhone === selfKey ? (
                  <button type="button" onClick={() => startWish(wish)} className="min-h-9 px-1 text-[13px] text-[#5F7290] underline underline-offset-2">
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
