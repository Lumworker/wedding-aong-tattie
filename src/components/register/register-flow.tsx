"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { ChevronLeft, Minus, Plus, Shirt, X } from "lucide-react"
import { Envelope, Garden, shortDateThai } from "@/components/register/garden"
import { CEREMONY_DATE_ISO, COUPLE, DRESS_CODE, PARTY_MAX, VENUE_MAP } from "@/lib/event"
import { newId } from "@/lib/id"
import { travelIcon, travelLabel } from "@/lib/labels"
import { formatThaiMobile, maskPhoneInput, normalizeThaiMobile } from "@/lib/phone"
import { DEFAULT_PROVINCE, PROVINCES, isProvince, looksLikePlate, normalizePlate } from "@/lib/plate"
import type { AgeGroup, Attendance, Car, FamilySide, Gender, Guest, Party, Travel, TravelMode } from "@/lib/types"
import { WISH_TEXT_MAX, clipWishText, wishGlyphCount } from "@/lib/wish"

/**
 * Register v2.3 (canvas boards W2–W7, 3 Nov 2026).
 * W2 start: phone + coming? · W3 returning phone asks for the saved name in a dialog
 * W4 who · W5 travel → W6 confirm sheet · W7 declined: name + optional letter.
 */
export type Stage = "start" | "who" | "travel" | "notgoing"
export const STAGES: Stage[] = ["start", "who", "travel", "notgoing"]
export type IdentifyResult = "saved" | "continue" | "need-name" | "wrong-name" | "locked"
export type SubmitError = Error & { code?: string; data?: Record<string, unknown> }

export const STORY_MAX = 1000
const CAR_MAX = 3
const NAME_MAX = 40
const NO_TRAVEL: Travel = { mode: null, needsParking: null, cars: [] }
const TRAVEL_CHOICES: TravelMode[] = ["drive", "taxi", "transit", "dropoff"]
const WISH_PRESETS = ["ยินดีด้วย!", "รักกันนาน ๆ", "ส่งกำลังใจจากไกล ๆ"]

type Form = {
  id: string
  name: string
  gender: Gender | null
  side: FamilySide | null
  attendance: Attendance | null
  /** Everyone coming, you included. */
  count: number
  kids: number
  story: string
  travel: Travel
  letter: string
}

function blankForm(): Form {
  return { id: newId("guest"), name: "", gender: null, side: null, attendance: null, count: 1, kids: 0, story: "", travel: NO_TRAVEL, letter: "" }
}

function fromParty(party: Party | null): Form {
  if (!party?.guests.length) return blankForm()
  const main = party.guests.find((guest) => !guest.isCompanion) ?? party.guests[0]
  const others = party.guests.filter((guest) => guest.id !== main.id)
  return {
    id: main.id,
    name: main.name,
    gender: main.gender === "other" ? null : main.gender,
    side: main.side ?? null,
    attendance: main.attendance,
    count: Math.min(PARTY_MAX, 1 + others.length),
    kids: others.filter((guest) => guest.ageGroup === "child").length,
    story: party.story ?? "",
    travel: party.travel ?? NO_TRAVEL,
    letter: "",
  }
}

function draftKey(phone: string) {
  return `webding-draft-v23:${phone}`
}

function readDraft(phone: string | null): Form | null {
  if (!phone) return null
  try {
    const raw = window.sessionStorage.getItem(draftKey(phone))
    return raw ? { ...blankForm(), ...(JSON.parse(raw) as Partial<Form>) } : null
  } catch {
    return null
  }
}

function writeDraft(phone: string | null, form: Form) {
  if (!phone) return
  try {
    window.sessionStorage.setItem(draftKey(phone), JSON.stringify(form))
  } catch {
    /* private mode */
  }
}

function clearDraft(phone: string | null) {
  if (!phone) return
  try {
    window.sessionStorage.removeItem(draftKey(phone))
  } catch {
    /* ignore */
  }
}

function companions(form: Form, phone: string, main: Guest, existing: Guest[]): Guest[] {
  const pool = existing.filter((guest) => guest.isCompanion)
  const total = form.attendance === "declined" ? 0 : form.count - 1
  const kids = Math.min(form.kids, total)
  const take = (ageGroup: AgeGroup, count: number, label: string): Guest[] => {
    const kept = pool.filter((guest) => (guest.ageGroup ?? "adult") === ageGroup).slice(0, count)
    while (kept.length < count) kept.push({ id: newId("guest"), name: label, gender: "other", ageGroup, attendance: main.attendance, partyPhone: phone })
    return kept.map((guest, index) => ({
      ...guest,
      name: count === 1 ? label : `${label} ${index + 1}`,
      gender: "other" as const,
      ageGroup,
      attendance: main.attendance,
      side: main.side,
      partyPhone: phone,
      isCompanion: true,
    }))
  }
  return [...take("adult", total - kids, "ผู้ติดตาม"), ...take("child", kids, "เด็ก")]
}

const sideNick = (side: FamilySide | null) =>
  side === "groom" ? COUPLE.groomNickname : side === "bride" ? COUPLE.brideNickname : "บ่าวสาว"

/* ---------------- small pieces ---------------- */

function TopBar({ step, of, label, onBack }: { step: number; of: number; label?: string; onBack: () => void }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 pr-4 pl-1">
      <button type="button" aria-label="ย้อนกลับ" onClick={onBack} className="flex size-11 items-center justify-center rounded-full hover:bg-[#FFF8E6]">
        <ChevronLeft aria-hidden="true" className="size-6" />
      </button>
      <div role="progressbar" aria-valuemin={1} aria-valuemax={of} aria-valuenow={step} aria-label={`ขั้นที่ ${step} จาก ${of}`} className="flex flex-1 gap-1.5">
        {Array.from({ length: of }, (_, index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full ${index + 1 < step ? "bg-[#2E4535]" : index + 1 === step ? "bg-[#8A9DB5]" : "bg-[#E6DCC4]"}`}
          />
        ))}
      </div>
      <span className="min-w-[34px] text-right font-display text-[13px] text-[#5B6B5F]">{label ?? `${step} / ${of}`}</span>
    </header>
  )
}

function Title({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div>
      <h1 id="register-step-title" tabIndex={-1} className="text-2xl font-semibold outline-none">
        {children}
      </h1>
      {sub ? <div className="mt-0.5 text-[13px] text-[#5B6B5F]">{sub}</div> : null}
    </div>
  )
}

function BottomAction({ children, onClick, pending }: { children: ReactNode; onClick: () => void; pending?: boolean }) {
  return (
    <div className="sticky bottom-0 z-20 mt-auto bg-gradient-to-t from-[#F6F1E8] from-70% to-transparent px-3.5 pt-5 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
      <button
        type="button"
        disabled={pending}
        onClick={onClick}
        className="h-[52px] w-full rounded-full bg-[#2E4535] text-base font-medium text-[#F6F1E8] hover:bg-[#22352A] disabled:opacity-60"
      >
        {children}
      </button>
    </div>
  )
}

function FieldError({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm text-[#9A3B2E]">
      {children}
    </p>
  )
}

function Pick({
  selected,
  onClick,
  children,
  className = "",
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`relative flex min-w-0 items-center justify-center gap-2 rounded-[18px] text-[15px] text-[#2E4535] ${
        selected ? "border-2 border-[#8A9DB5] bg-[#EDF0F5] font-semibold" : "border border-[#E6DCC4] bg-[#FFFCF5] hover:bg-[#FFF8E6]"
      } ${className}`}
    >
      {children}
    </button>
  )
}

function CheckBadge() {
  return (
    <span aria-hidden="true" className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-[#2E4535]">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F6F1E8" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
  )
}

const inputClass =
  "h-14 w-full rounded-2xl border border-[#CFC6B4] bg-[#FFFCF5] px-4 text-lg text-[#2E4535] outline-none focus:border-2 focus:border-[#8A9DB5]"

/* ---------------- main ---------------- */

export function RegisterFlow({
  phone,
  lastPhone,
  party,
  urlStep,
  onNavigate,
  onIdentify,
  onSubmit,
  onSendLetter,
  onDone,
  onLeave,
}: {
  /** Verified session phone, or null. */
  phone: string | null
  lastPhone?: string | null
  party: Party | null
  urlStep: string | null
  onNavigate: (stage: Stage, replace?: boolean) => void
  onIdentify: (phone: string, name?: string) => Promise<IdentifyResult>
  /** Save only; `onDone` moves on to the dashboard. */
  onSubmit: (party: Party) => Promise<void>
  /** Save the W7 letter after the party exists. */
  onSendLetter: (from: string, text: string) => Promise<void>
  onDone: () => void
  onLeave: () => void
}) {
  const editing = Boolean(party?.guests.length)
  const [form, setForm] = useState<Form>(() => (editing ? fromParty(party) : readDraft(phone) ?? fromParty(party)))
  const [phoneText, setPhoneText] = useState(() => formatThaiMobile(phone ?? lastPhone ?? "") || "")
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [pending, setPending] = useState(false)
  const [askName, setAskName] = useState(false)
  const [verifyName, setVerifyName] = useState("")
  const [confirm, setConfirm] = useState(false)
  const activePhone = useRef(phone)

  const declined = form.attendance === "declined"
  const typedPhone = normalizeThaiMobile(phoneText)

  const stage: Stage = (() => {
    const wanted = (STAGES as string[]).includes(urlStep ?? "") ? (urlStep as Stage) : "start"
    if (!phone || !form.attendance) return "start"
    if (wanted === "notgoing") return declined ? "notgoing" : "who"
    if (declined) return wanted === "start" ? "start" : "notgoing"
    if (wanted === "travel" && !(form.name.trim() && form.side)) return "who"
    return wanted
  })()

  useEffect(() => {
    document.getElementById("register-step-title")?.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
  }, [stage])

  useEffect(() => {
    if (!editing) writeDraft(activePhone.current, form)
  }, [editing, form])

  function patch(next: Partial<Form>) {
    setForm((current) => ({ ...current, ...next }))
    setErrors((current) => {
      const cleared: Record<string, string | undefined> = { ...current, summary: undefined }
      for (const key of Object.keys(next)) delete cleared[key]
      return cleared
    })
  }

  function patchTravel(next: Partial<Travel>) {
    setForm((current) => {
      const travel = { ...current.travel, ...next }
      if (travel.mode !== "drive") travel.needsParking = null
      else if (travel.needsParking === null) travel.needsParking = false
      if (!(travel.mode === "drive" && travel.needsParking)) travel.cars = []
      else if (travel.cars.length === 0) travel.cars = [{ id: newId("car"), plate: "", province: "" }]
      return { ...current, travel }
    })
    setErrors((current) => ({ ...current, mode: undefined, cars: undefined, summary: undefined }))
  }

  function patchCar(id: string, next: Partial<Car>) {
    setForm((current) => ({
      ...current,
      travel: { ...current.travel, cars: current.travel.cars.map((car) => (car.id === id ? { ...car, ...next } : car)) },
    }))
    setErrors((current) => ({ ...current, [`car-${id}`]: undefined, summary: undefined }))
  }

  /* ----- W2 / W3 ----- */

  function afterStart() {
    onNavigate(form.attendance === "declined" ? "notgoing" : "who", !phone)
  }

  async function submitStart() {
    if (pending) return
    const next: Record<string, string> = {}
    if (!typedPhone) next.phone = "กรอกเบอร์มือถือ 10 หลัก ขึ้นต้นด้วย 06, 08 หรือ 09"
    if (!form.attendance) next.attendance = "เลือกก่อนว่าจะมาไหม"
    setErrors(next)
    if (Object.keys(next).length || !typedPhone) return
    if (phone && typedPhone === phone) {
      afterStart()
      return
    }
    // A new session remounts this form (keyed by phone), so hand the answer over through the draft.
    writeDraft(typedPhone, { ...(readDraft(typedPhone) ?? form), attendance: form.attendance })
    setPending(true)
    try {
      const result = await onIdentify(typedPhone)
      if (result === "need-name") {
        setAskName(true)
        setVerifyName("")
      } else if (result === "locked") {
        setErrors({ phone: "ลองหลายครั้งเกินไป รอ 15 นาทีแล้วลองใหม่ หรือติดต่อบ่าวสาว" })
      } else if (result === "continue") {
        if (activePhone.current !== typedPhone) {
          activePhone.current = typedPhone
          const stored = readDraft(typedPhone)
          if (stored) setForm({ ...stored, attendance: form.attendance })
        }
        onNavigate(form.attendance === "declined" ? "notgoing" : "who", true)
      }
    } catch (caught) {
      setErrors({ phone: caught instanceof Error ? caught.message : "เปิดข้อมูลไม่สำเร็จ ลองอีกครั้งนะ" })
    } finally {
      setPending(false)
    }
  }

  async function submitReturning() {
    if (pending || !typedPhone) return
    if (!verifyName.trim()) {
      setErrors({ verify: "พิมพ์ชื่อที่ลงไว้ก่อนนะ" })
      return
    }
    setPending(true)
    try {
      const result = await onIdentify(typedPhone, verifyName.trim())
      if (result === "wrong-name") setErrors({ verify: "ชื่อไม่ตรงกับที่ลงไว้ ลองพิมพ์ให้ตรงอีกครั้ง" })
      else if (result === "locked") setErrors({ verify: "ลองหลายครั้งเกินไป รอ 15 นาทีแล้วลองใหม่ หรือติดต่อบ่าวสาว" })
    } catch (caught) {
      setErrors({ verify: caught instanceof Error ? caught.message : "เปิดข้อมูลไม่สำเร็จ ลองอีกครั้งนะ" })
    } finally {
      setPending(false)
    }
  }

  /* ----- W4 / W5 / W6 ----- */

  function checkWho() {
    const next: Record<string, string> = {}
    if (!form.name.trim()) next.name = "กรอกชื่อที่บ่าวสาวเรียกก่อนนะ"
    if (!form.side) next.side = "เลือกฝั่งที่รู้จักก่อนนะ"
    setErrors(next)
    if (next.name) document.getElementById("who-name")?.focus()
    return !Object.keys(next).length
  }

  function checkTravel() {
    const next: Record<string, string> = {}
    const travel = form.travel
    if (!travel.mode) next.mode = "เลือกวิธีมาก่อนนะ"
    if (travel.mode === "drive" && travel.needsParking) {
      const seen = new Set<string>()
      for (const car of travel.cars) {
        const norm = normalizePlate(car.plate)
        const province = car.province.trim() || DEFAULT_PROVINCE
        if (!norm) next[`car-${car.id}`] = "กรอกทะเบียนรถ"
        else if (!isProvince(province)) next[`car-${car.id}`] = "เลือกจังหวัดจากรายการ"
        else if (seen.has(`${norm}|${province}`)) next[`car-${car.id}`] = "ทะเบียนนี้กรอกซ้ำแล้ว"
        seen.add(`${norm}|${province}`)
      }
    }
    setErrors(next)
    return !Object.keys(next).length
  }

  function buildParty(): Party | null {
    if (!phone || !form.attendance) {
      onNavigate("start")
      return null
    }
    const side = form.side ?? party?.guests.find((guest) => !guest.isCompanion)?.side
    const main: Guest = {
      id: form.id,
      name: form.name.trim().slice(0, NAME_MAX),
      gender: form.gender ?? "other",
      ageGroup: "adult",
      attendance: form.attendance,
      ...(side ? { side } : {}),
      partyPhone: phone,
    }
    const travel: Travel =
      declined
        ? NO_TRAVEL
        : {
            ...form.travel,
            cars: form.travel.cars.map((car) => ({ ...car, plate: car.plate.trim(), province: car.province.trim() || DEFAULT_PROVINCE })),
          }
    return {
      phone,
      updatedAt: new Date().toISOString(),
      guests: [main, ...companions(form, phone, main, party?.guests ?? [])],
      travel,
      story: Array.from(form.story.trim()).slice(0, STORY_MAX).join(""),
    }
  }

  async function save() {
    if (pending) return
    const next = buildParty()
    if (!next) return
    setPending(true)
    setErrors({})
    try {
      await onSubmit(next)
      if (declined && form.letter.trim()) {
        try {
          await onSendLetter(next.guests[0].name, clipWishText(form.letter.trim()))
        } catch {
          /* the RSVP is saved; the letter can be written again from the dashboard */
        }
      }
      clearDraft(phone)
      onDone()
    } catch (caught) {
      const error = caught as SubmitError
      if (error.code === "plate-taken") {
        const car = form.travel.cars.find(
          (item) => normalizePlate(item.plate) === error.data?.plate && (item.province.trim() || DEFAULT_PROVINCE) === error.data?.province
        )
        setConfirm(false)
        setErrors(car ? { [`car-${car.id}`]: error.message } : { summary: error.message })
      } else {
        setErrors({ summary: error.message || "บันทึกไม่สำเร็จ ลองอีกครั้งนะ" })
      }
    } finally {
      setPending(false)
    }
  }

  /* ---------------- render ---------------- */

  const dateLine = `${shortDateThai(CEREMONY_DATE_ISO)} · ${VENUE_MAP.name}`
  const totalSteps = declined ? 2 : 3

  if (stage === "start") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#F6F1E8] text-[#2E4535]">
        <TopBar step={1} of={totalSteps} onBack={editing ? () => onNavigate(declined ? "notgoing" : "who") : onLeave} />
        <Garden height={140} coupleSize={100} floor={44} coupleTop={26} halo={126} haloTop={22} bubble="มาด้วยกันนะ" className="mx-3.5" />
        <div className="flex flex-col gap-4 px-5 pt-4">
          <Title sub={dateLine}>มาร่วมงานไหม</Title>
          <div>
            <label htmlFor="start-phone" className="mb-1.5 block text-[13px] text-[#5B6B5F]">
              เบอร์มือถือ (ใช้เข้าหน้างานครั้งหน้า)
            </label>
            <span className="relative block">
              <input
                id="start-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="08X-XXX-XXXX"
                value={phoneText}
                aria-invalid={errors.phone ? true : undefined}
                aria-describedby={errors.phone ? "start-phone-error" : undefined}
                onChange={(event) => {
                  setPhoneText(maskPhoneInput(event.target.value))
                  setErrors((current) => ({ ...current, phone: undefined }))
                }}
                className={`${inputClass} font-display tracking-[0.04em] text-xl`}
              />
            </span>
            <FieldError id="start-phone-error">{errors.phone}</FieldError>
          </div>
          <fieldset>
            <legend className="sr-only">จะมาร่วมงานไหม</legend>
            <div className="flex flex-col gap-2">
              <Pick selected={form.attendance === "attending"} onClick={() => patch({ attendance: "attending" })} className="h-[68px] text-[17px]">
                <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#2E4535]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </span>
                มา
              </Pick>
              <div className="grid grid-cols-2 gap-2">
                <Pick selected={form.attendance === "unsure"} onClick={() => patch({ attendance: "unsure" })} className="h-[60px] px-2.5">
                  <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-[#5B6B5F]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5B6B5F" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 9a3 3 0 1 1 4.2 2.75c-.75.33-1.2 1.05-1.2 1.85V14" />
                      <path d="M12 18h.01" />
                    </svg>
                  </span>
                  ยังไม่แน่ใจ
                </Pick>
                <Pick
                  selected={form.attendance === "declined"}
                  onClick={() => patch({ attendance: "declined" })}
                  className="h-[60px] px-2.5"
                >
                  <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#C2453A]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </span>
                  ไปไม่ได้
                </Pick>
              </div>
            </div>
            <FieldError>{errors.attendance}</FieldError>
          </fieldset>
        </div>
        <BottomAction onClick={submitStart} pending={pending}>
          {pending ? "กำลังเปิด…" : "ต่อไป"}
        </BottomAction>

        {askName ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(46,69,53,0.45)] px-6">
            <div role="alertdialog" aria-modal="true" aria-labelledby="returning-title" className="flex w-full max-w-sm flex-col gap-3 rounded-[22px] bg-[#FFFCF5] px-[18px] pt-5 pb-2.5">
              <Garden height={84} coupleSize={64} floor={22} coupleTop={12} halo={80} haloTop={8} />
              <div className="text-center">
                <h2 id="returning-title" className="text-xl font-semibold">
                  เบอร์นี้ตอบไว้แล้ว
                </h2>
                <p className="mt-0.5 text-sm text-[#5B6B5F]">พิมพ์ชื่อที่ลงไว้ แล้วเข้าหน้างานได้เลย</p>
              </div>
              <input
                aria-label="ชื่อที่ลงไว้"
                autoFocus
                value={verifyName}
                maxLength={NAME_MAX}
                onChange={(event) => {
                  setVerifyName(event.target.value)
                  setErrors({})
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void submitReturning()
                }}
                className="h-[52px] rounded-2xl border-2 border-[#8A9DB5] bg-[#FFFCF5] px-3.5 text-center text-lg outline-none"
              />
              <FieldError>{errors.verify}</FieldError>
              <button
                type="button"
                disabled={pending}
                onClick={submitReturning}
                className="h-[52px] rounded-full bg-[#2E4535] text-base font-medium text-[#F6F1E8] disabled:opacity-60"
              >
                {pending ? "กำลังเปิด…" : "เข้าหน้างาน"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAskName(false)
                  setPhoneText("")
                  setErrors({})
                  window.setTimeout(() => document.getElementById("start-phone")?.focus(), 30)
                }}
                className="min-h-11 text-sm text-[#5B6B5F]"
              >
                ใช้เบอร์อื่น
              </button>
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  if (stage === "notgoing") {
    const count = wishGlyphCount(form.letter)
    return (
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden bg-[#F6F1E8] text-[#2E4535]">
        <TopBar step={2} of={2} onBack={() => onNavigate("start")} />
        <div className="relative z-10 flex flex-col gap-3.5 px-5 pt-2">
          <Title sub={<span className="text-sm">ฝากชื่อไว้ แล้วเขียนจดหมายถึงเราก็ได้นะ</span>}>ไม่เป็นไรเลย</Title>
          <div>
            <label htmlFor="who-name" className="mb-1.5 block text-[13px] text-[#5B6B5F]">
              ชื่อที่บ่าวสาวเรียก
            </label>
            <input
              id="who-name"
              value={form.name}
              maxLength={NAME_MAX}
              autoComplete="name"
              aria-invalid={errors.name ? true : undefined}
              onChange={(event) => patch({ name: event.target.value })}
              className={inputClass}
            />
            <FieldError>{errors.name}</FieldError>
          </div>
          {editing ? null : (
            <>
              <label className="flex flex-col gap-1.5 text-[13px] text-[#5B6B5F]">
                <span>
                  จดหมายถึงบ่าวสาว <span className="text-xs">(ไม่บังคับ)</span>
                </span>
                <span className="relative block rounded-2xl border-[1.5px] border-[#E0AFA6] bg-[#FFFCF5] px-3.5 pt-3 pb-7 focus-within:border-[#8A9DB5]">
                  <textarea
                    value={form.letter}
                    rows={4}
                    placeholder={`เขียนถึง${COUPLE.groomNickname}กับ${COUPLE.brideNickname}…`}
                    onChange={(event) => patch({ letter: clipWishText(event.target.value) })}
                    className="block w-full resize-none bg-transparent text-[15px] leading-relaxed text-[#2E4535] outline-none"
                  />
                  <span aria-live="polite" className="absolute right-3 bottom-1.5 font-display text-xs text-[#5B6B5F]">
                    {count}/{WISH_TEXT_MAX}
                  </span>
                </span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {WISH_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => patch({ letter: clipWishText(form.letter ? `${form.letter} ${preset}` : preset) })}
                    className="h-9 rounded-full border border-[#E0AFA6] bg-[#FFFCF5] px-3 text-[13px] hover:bg-[#F8ECE8]"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </>
          )}
          <FieldError>{errors.summary}</FieldError>
        </div>
        <div aria-hidden="true" className="pointer-events-none relative mt-6 h-[120px] shrink-0">
          <div className="gingham absolute inset-x-0 bottom-0 h-[76px] border-t border-[#E6DCC4]" />
          <span className="absolute bottom-[86px] left-5 rounded-full border border-[#E6DCC4] bg-[#FFFCF5] px-2.5 py-0.5 text-[11px]">ส่งกำลังใจจากไกล ๆ</span>
          <Envelope width={22} className="absolute right-7 bottom-[84px] rotate-[8deg]" />
        </div>
        <BottomAction
          pending={pending}
          onClick={() => {
            if (!form.name.trim()) {
              setErrors({ name: "กรอกชื่อที่บ่าวสาวเรียกก่อนนะ" })
              return
            }
            void save()
          }}
        >
          {pending ? "กำลังส่ง…" : editing ? "บันทึก" : "ส่งคำตอบ"}
        </BottomAction>
      </div>
    )
  }

  if (stage === "who") {
    const nick = sideNick(form.side)
    const storyCount = wishGlyphCount(form.story)
    const prompts = ["เจอกันครั้งแรก…", "เรื่องที่ยังจำได้", `${nick}ในสายตาเรา`]
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#F6F1E8] text-[#2E4535]">
        <TopBar step={2} of={3} onBack={() => onNavigate("start")} />
        <div className="flex flex-col gap-3.5 px-5 pt-1">
          <Title>คุณคือใคร</Title>
          <div>
            <label htmlFor="who-name" className="mb-1.5 block text-[13px] text-[#5B6B5F]">
              ชื่อที่บ่าวสาวเรียก
            </label>
            <input
              id="who-name"
              value={form.name}
              maxLength={NAME_MAX}
              autoComplete="name"
              placeholder="เช่น ชื่อเล่น"
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? "who-name-error" : undefined}
              onChange={(event) => patch({ name: event.target.value })}
              className={inputClass}
            />
            <FieldError id="who-name-error">{errors.name}</FieldError>
          </div>

          <fieldset>
            <legend className="mb-1.5 text-[13px] text-[#5B6B5F]">
              เพศ <span className="text-xs">(ไม่ระบุก็ได้)</span>
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {(["male", "female"] as const).map((gender) => (
                <Pick
                  key={gender}
                  selected={form.gender === gender}
                  onClick={() => patch({ gender: form.gender === gender ? null : gender })}
                  className="h-14"
                >
                  {form.gender === gender ? <CheckBadge /> : null}
                  {gender === "male" ? "ชาย" : "หญิง"}
                </Pick>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-1.5 text-[13px] text-[#5B6B5F]">รู้จักฝั่งไหน</legend>
            <div className="grid grid-cols-2 gap-2">
              {(["groom", "bride"] as const).map((side) => (
                <Pick key={side} selected={form.side === side} onClick={() => patch({ side })} className="h-14">
                  {form.side === side ? <CheckBadge /> : null}
                  ฝั่ง{sideNick(side)}
                </Pick>
              ))}
            </div>
            <FieldError>{errors.side}</FieldError>
          </fieldset>

          {declined ? null : (
            <div className="rounded-[18px] border border-[#E6DCC4] bg-[#FFFCF5] py-1.5 pr-2.5 pl-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-base font-medium">
                    มากี่คน <span className="text-xs font-normal text-[#5B6B5F]">รวมตัวคุณ</span>
                  </p>
                  <label className={`mt-0.5 flex min-h-6 items-center gap-1.5 text-[13px] ${form.count < 2 ? "opacity-50" : ""}`}>
                    <input
                      type="checkbox"
                      disabled={form.count < 2}
                      checked={form.kids > 0}
                      onChange={(event) => patch({ kids: event.target.checked ? 1 : 0 })}
                      className="size-[18px] accent-[#2E4535]"
                    />
                    มีเด็กมาด้วย
                  </label>
                </div>
                <Stepper
                  label="จำนวนคน"
                  value={form.count}
                  min={1}
                  max={PARTY_MAX}
                  onChange={(count) => patch({ count, kids: Math.min(form.kids, count - 1) })}
                />
              </div>
              {form.kids > 0 ? (
                <div className="mt-1 flex items-center justify-between border-t border-[#E6DCC4] pt-1">
                  <p className="text-[13px] text-[#5B6B5F]">ในนั้นเป็นเด็ก</p>
                  <Stepper label="จำนวนเด็ก" value={form.kids} min={1} max={form.count - 1} onChange={(kids) => patch({ kids })} small />
                </div>
              ) : null}
            </div>
          )}

          <div>
            <label htmlFor="who-story" className="mb-1.5 block text-[13px] text-[#5B6B5F]">
              เล่าเรื่องคุณกับ<b className="font-semibold text-[#2E4535]">{nick}</b>หน่อย <span className="text-xs">(ไม่บังคับ)</span>
            </label>
            <span className="relative block rounded-2xl border-[1.5px] border-[#E0AFA6] bg-[#FFFCF5] px-3.5 pt-2.5 pb-6 focus-within:border-[#8A9DB5]">
              <textarea
                id="who-story"
                value={form.story}
                rows={3}
                placeholder="รู้จักกันได้ยังไง · ความทรงจำที่ยังจำได้ · เรื่องที่อยากเล่าให้บ่าวสาวฟัง"
                onChange={(event) => patch({ story: Array.from(event.target.value).slice(0, STORY_MAX).join("") })}
                className="block max-h-[9.5rem] min-h-[4.5rem] w-full resize-none bg-transparent text-[15px] leading-normal text-[#2E4535] outline-none [field-sizing:content]"
              />
              <span aria-live="polite" className="absolute right-3 bottom-1 font-display text-xs text-[#5B6B5F]">
                {storyCount}/{STORY_MAX}
              </span>
            </span>
            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    const next = form.story ? `${form.story.trimEnd()}\n${prompt} ` : `${prompt} `
                    patch({ story: Array.from(next).slice(0, STORY_MAX).join("") })
                    window.setTimeout(() => document.getElementById("who-story")?.focus(), 0)
                  }}
                  className="h-8 shrink-0 rounded-full border border-[#E0AFA6] bg-[#FFFCF5] px-2.5 text-xs hover:bg-[#F8ECE8]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
          <FieldError>{errors.summary}</FieldError>
        </div>
        <BottomAction
          pending={pending}
          onClick={() => {
            if (!checkWho()) return
            if (declined) void save()
            else onNavigate("travel")
          }}
        >
          ต่อไป
        </BottomAction>
      </div>
    )
  }

  /* stage === "travel" (W5) + W6 confirm sheet */
  const travel = form.travel
  const drive = travel.mode === "drive"
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#F6F1E8] text-[#2E4535]">
      <TopBar step={3} of={3} label="ข้อสุดท้าย" onBack={() => onNavigate("who")} />
      <div className="flex flex-col gap-4 px-5 pt-2">
        <Title>มายังไง</Title>
        <fieldset>
          <legend className="sr-only">วิธีมาร่วมงาน</legend>
          <div className="grid grid-cols-2 gap-2">
            {TRAVEL_CHOICES.map((mode) => (
              <Pick key={mode} selected={travel.mode === mode} onClick={() => patchTravel({ mode })} className="h-[92px] flex-col gap-1">
                {travel.mode === mode ? <CheckBadge /> : null}
                {/* eslint-disable-next-line @next/next/no-img-element -- pixel sprite */}
                <img src={travelIcon(mode)} alt="" width={44} height={44} className="size-11 [image-rendering:pixelated]" />
                {mode === "drive" ? "ขับรถมา" : travelLabel(mode)}
              </Pick>
            ))}
          </div>
          {form.attendance === "unsure" ? (
            <Pick selected={travel.mode === "unknown"} onClick={() => patchTravel({ mode: "unknown" })} className="mt-2 h-12 w-full text-sm">
              ยังไม่รู้ ไว้ค่อยอัปเดต
            </Pick>
          ) : null}
          <FieldError>{errors.mode}</FieldError>
        </fieldset>

        {drive ? (
          <div className="flex items-center justify-between rounded-[18px] border border-[#E6DCC4] bg-[#FFFCF5] py-2 pr-3 pl-4">
            <div>
              <p className="text-base font-medium">ขอที่จอดรถ</p>
              <p className="text-xs text-[#5B6B5F]">ที่จอดมีจำกัด จะแจ้งยืนยันใกล้วันงาน</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(travel.needsParking)}
              aria-label="ขอที่จอดรถ"
              onClick={() => patchTravel({ needsParking: !travel.needsParking })}
              className={`relative h-8 w-[52px] shrink-0 rounded-full transition-colors ${travel.needsParking ? "bg-[#2E4535]" : "bg-[#CFC6B4]"}`}
            >
              <span
                className={`absolute top-[3px] size-[26px] rounded-full bg-[#FFF8E6] transition-[left] ${travel.needsParking ? "left-[23px]" : "left-[3px]"}`}
              />
            </button>
          </div>
        ) : null}

        {drive && travel.needsParking ? (
          <div className="flex flex-col gap-3">
            <datalist id="province-list">
              {PROVINCES.map((province) => (
                <option key={province} value={province} />
              ))}
            </datalist>
            {travel.cars.map((car, index) => {
              const error = errors[`car-${car.id}`]
              const norm = normalizePlate(car.plate)
              return (
                <div key={car.id}>
                  <div className="flex items-end gap-2">
                    <label className="flex min-w-0 flex-[1.1] flex-col gap-1.5 text-[13px] text-[#5B6B5F]">
                      {travel.cars.length > 1 ? `ทะเบียนคันที่ ${index + 1}` : "ทะเบียน"}
                      <input
                        id={`plate-${car.id}`}
                        value={car.plate}
                        maxLength={12}
                        placeholder="1กข 1234"
                        aria-invalid={error ? true : undefined}
                        onChange={(event) => patchCar(car.id, { plate: event.target.value })}
                        className={`${inputClass} px-3.5`}
                      />
                    </label>
                    <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-[13px] text-[#5B6B5F]">
                      จังหวัด
                      <input
                        list="province-list"
                        value={car.province}
                        placeholder="กรุงเทพฯ"
                        onChange={(event) => patchCar(car.id, { province: event.target.value })}
                        className={`${inputClass} px-3.5`}
                      />
                    </label>
                    {travel.cars.length > 1 ? (
                      <button
                        type="button"
                        aria-label={`ลบรถคันที่ ${index + 1}`}
                        onClick={() => setForm((current) => ({ ...current, travel: { ...current.travel, cars: current.travel.cars.filter((item) => item.id !== car.id) } }))}
                        className="mb-1.5 flex size-11 shrink-0 items-center justify-center text-[#5B6B5F]"
                      >
                        <X aria-hidden="true" className="size-4" />
                      </button>
                    ) : null}
                  </div>
                  {error ? (
                    <FieldError>{error}</FieldError>
                  ) : norm && !looksLikePlate(norm) ? (
                    <p className="mt-1.5 text-[13px] text-[#5B6B5F]">รูปแบบทะเบียนดูไม่คุ้น ตรวจอีกครั้ง (ป้ายพิเศษใส่ได้)</p>
                  ) : null}
                </div>
              )
            })}
            <p className="-mt-1 text-xs text-[#5B6B5F]">
              เว้นจังหวัดว่าง = กรุงเทพฯ
              {travel.cars.length < CAR_MAX ? (
                <>
                  {" · "}
                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        travel: { ...current.travel, cars: [...current.travel.cars, { id: newId("car"), plate: "", province: "" }] },
                      }))
                    }
                    className="inline-flex min-h-8 items-center underline underline-offset-2"
                  >
                    + เพิ่มอีกคัน
                  </button>
                </>
              ) : null}
            </p>
          </div>
        ) : null}
        <FieldError>{errors.summary}</FieldError>
      </div>
      <BottomAction
        onClick={() => {
          if (checkTravel()) setConfirm(true)
        }}
      >
        ส่งคำตอบ
      </BottomAction>

      {confirm ? (
        <ConfirmSheet
          form={form}
          pending={pending}
          error={errors.summary}
          editing={editing}
          onConfirm={save}
          onClose={() => setConfirm(false)}
        />
      ) : null}
    </div>
  )
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  small = false,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (next: number) => void
  small?: boolean
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        aria-label={`ลด${label}`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className="flex size-11 items-center justify-center rounded-full border border-[#CFC6B4] bg-[#FFF8E6] disabled:opacity-40"
      >
        <Minus aria-hidden="true" className="size-5" />
      </button>
      <span aria-live="polite" className={`w-7 text-center font-display ${small ? "text-lg" : "text-2xl"}`}>
        {value}
      </span>
      <button
        type="button"
        aria-label={`เพิ่ม${label}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className="flex size-11 items-center justify-center rounded-full bg-[#2E4535] text-[#F6F1E8] disabled:opacity-40"
      >
        <Plus aria-hidden="true" className="size-5" />
      </button>
    </div>
  )
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full border border-[#E6DCC4] bg-[#FFF8E6] px-3 text-sm">{children}</span>
  )
}

function ConfirmSheet({
  form,
  pending,
  error,
  editing,
  onConfirm,
  onClose,
}: {
  form: Form
  pending: boolean
  error?: string
  editing: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  const travel = form.travel
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(46,69,53,0.45)]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-t-3xl bg-[#FFFCF5] motion-safe:animate-in motion-safe:slide-in-from-bottom-8"
      >
        <div className="relative">
          <Garden height={128} coupleSize={96} floor={36} coupleTop={22} halo={120} haloTop={14} className="rounded-none border-0 border-b" />
          <span aria-hidden="true" className="absolute top-2.5 left-1/2 h-1 w-10 -translate-x-1/2 rounded-sm bg-[#CFC6B4]" />
        </div>
        <div className="flex flex-col gap-3.5 px-5 pt-4 pb-[max(env(safe-area-inset-bottom),1.375rem)]">
          <h2 id="confirm-title" className="text-[22px] font-semibold">
            เช็กอีกนิดนะ
          </h2>
          <div className="flex flex-wrap gap-2">
            <Chip>
              <b className="font-semibold">{form.attendance === "unsure" ? "ยังไม่แน่ใจ" : "มา"}</b>
            </Chip>
            <Chip>
              {form.name.trim()} · ฝั่ง{sideNick(form.side)}
            </Chip>
            <Chip>
              <span className="font-display">{form.count}</span> คน{form.kids ? ` (เด็ก ${form.kids})` : ""}
            </Chip>
            {travel.mode ? (
              <Chip>
                {travel.mode !== "unknown" ? (
                  // eslint-disable-next-line @next/next/no-img-element -- pixel sprite
                  <img src={travelIcon(travel.mode)} alt="" width={18} height={18} className="size-[18px] [image-rendering:pixelated]" />
                ) : null}
                {travel.mode === "drive" && travel.needsParking
                  ? travel.cars.map((car) => `${car.plate.trim()} ${car.province.trim() || DEFAULT_PROVINCE}`).join(", ")
                  : travel.mode === "drive"
                    ? "ขับรถมา · ไม่ขอที่จอด"
                    : travelLabel(travel.mode)}
              </Chip>
            ) : null}
            {form.story.trim() ? <Chip>มีเรื่องเล่า</Chip> : null}
          </div>
          <div role="note" className="flex items-center gap-2.5 rounded-2xl bg-[#CCCDB0] px-3.5 py-3">
            <Shirt aria-hidden="true" className="size-[22px] shrink-0" />
            <p className="text-sm">
              <b className="font-semibold">{DRESS_CODE.title.replace("การแต่งกาย: ", "แต่งกาย")}</b> · {DRESS_CODE.detail}
            </p>
          </div>
          {error ? (
            <p role="alert" className="text-sm text-[#9A3B2E]">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className="h-[52px] w-full rounded-full bg-[#2E4535] text-base font-medium text-[#F6F1E8] hover:bg-[#22352A] disabled:opacity-60"
          >
            {pending ? "กำลังบันทึก…" : editing ? "บันทึก กลับหน้างาน" : "ยืนยัน เข้างานเลย"}
          </button>
          <button type="button" onClick={onClose} className="-mt-2 min-h-11 text-sm text-[#5B6B5F]">
            แก้ไข
          </button>
        </div>
      </div>
    </div>
  )
}
