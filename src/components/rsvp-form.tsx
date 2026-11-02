"use client"

import { FormEvent, useEffect, useRef, useState, type ReactNode } from "react"
import { MapPin, Minus, Plus, X } from "lucide-react"
import { Choice } from "@/components/choice"
import { CouplePeek } from "@/components/couple-peek"
import { FormStepper, type StepperItem } from "@/components/form-stepper"
import { ScreenShell } from "@/components/screen-shell"
import { WelcomeScene } from "@/components/welcome-scene"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCoupleJumpPlayback } from "@/components/venue/character"
import { COUPLE_PEEK } from "@/lib/couple-atlas"
import { COUPLE, DRESS_CODE, PARTY_MAX, VENUE_MAP } from "@/lib/event"
import { newId } from "@/lib/id"
import { attendanceLabel, stepIcon, travelIcon, travelLabel } from "@/lib/labels"
import { formatThaiMobile, maskPhoneInput, normalizeThaiMobile } from "@/lib/phone"
import { DEFAULT_PROVINCE, PROVINCES, looksLikePlate, normalizePlate } from "@/lib/plate"
import type { AgeGroup, Attendance, Car, FamilySide, Gender, Guest, Party, Travel, TravelMode } from "@/lib/types"
import { cn } from "@/lib/utils"

const COMPANION_MAX = PARTY_MAX - 1
const CAR_MAX = 3

export type Stage = "phone" | "intro" | "attend" | "about" | "travel" | "review"
export const FORM_STAGES: Stage[] = ["attend", "about", "travel", "review"]

type Draft = {
  id: string
  name: string
  gender: Gender | null
  attendance: Attendance | null
  side: FamilySide | null
}

type Errors = {
  name?: string
  gender?: string
  attendance?: string
  side?: string
  mode?: string
  parking?: string
  cars?: Record<string, string>
}

const NO_TRAVEL: Travel = { mode: null, needsParking: null, cars: [] }

function blank(): Draft {
  return {
    id: newId("guest"),
    name: "",
    gender: null,
    attendance: null,
    side: null,
  }
}

function blankCar(): Car {
  return { id: newId("car"), plate: "", province: DEFAULT_PROVINCE }
}

type FormState = { person: Draft; adults: number; kids: number; travel: Travel }

function fromParty(party: Party | null): FormState {
  if (!party?.guests.length) return { person: blank(), adults: 0, kids: 0, travel: NO_TRAVEL }
  const main = party.guests.find((guest) => !guest.isCompanion) ?? party.guests[0]
  const others = party.guests.filter((guest) => guest.id !== main.id)
  const kids = others.filter((guest) => guest.ageGroup === "child").length
  return {
    person: {
      id: main.id,
      name: main.name,
      gender: main.gender,
      attendance: main.attendance,
      side: main.side ?? null,
    },
    adults: Math.min(COMPANION_MAX, others.length - kids),
    kids: Math.min(COMPANION_MAX, kids),
    travel: party.travel ?? NO_TRAVEL,
  }
}

function buildCompanions(
  adults: number,
  kids: number,
  phone: string,
  template: Pick<Guest, "attendance" | "side">,
  existing: Guest[]
): Guest[] {
  const pool = existing.filter((guest) => guest.isCompanion)
  const take = (ageGroup: AgeGroup, count: number, label: string): Guest[] => {
    const kept = pool.filter((guest) => (guest.ageGroup ?? "adult") === ageGroup).slice(0, count)
    while (kept.length < count) {
      kept.push({ id: newId("guest"), name: label, gender: "other", ageGroup, attendance: template.attendance, partyPhone: phone })
    }
    return kept.map((guest, index) => ({
      ...guest,
      name: count === 1 ? label : `${label} ${index + 1}`,
      gender: "other" as const,
      ageGroup,
      attendance: template.attendance,
      side: template.side,
      partyPhone: phone,
      isCompanion: true,
    }))
  }
  return [...take("adult", adults, "ผู้ติดตาม"), ...take("child", kids, "เด็ก")]
}

function draftKey(phone: string) {
  return `webding-draft:${phone}`
}

function readDraft(phone: string | null): FormState | null {
  if (!phone) return null
  try {
    const raw = window.sessionStorage.getItem(draftKey(phone))
    return raw ? (JSON.parse(raw) as FormState) : null
  } catch {
    return null
  }
}

function writeDraft(phone: string | null, state: FormState) {
  if (!phone) return
  try {
    window.sessionStorage.setItem(draftKey(phone), JSON.stringify(state))
  } catch {
    /* private mode: draft just won't survive a reload */
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

/** Steps shown on the stepper line for this answer. Declined skips travel. */
function stepsFor(attendance: Attendance | null): Stage[] {
  return attendance === "declined" ? ["attend", "about", "review"] : FORM_STAGES
}

function Counter({
  label,
  hint,
  value,
  min,
  max,
  onChange,
  disabled,
}: {
  label: string
  hint?: string
  value: number
  min: number
  max: number
  onChange: (next: number) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[15px] leading-normal font-medium">{label}</p>
        {hint ? <p className="text-[13px] leading-6 text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 min-h-11 min-w-11 rounded-full bg-card"
          aria-label={`ลด${label}`}
          disabled={value <= min || disabled}
          onClick={() => onChange(value - 1)}
        >
          <Minus />
        </Button>
        <p className="w-8 text-center font-sans text-xl leading-normal font-bold tabular-nums text-ink" aria-live="polite">
          {value}
        </p>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 min-h-11 min-w-11 rounded-full bg-card"
          aria-label={`เพิ่ม${label}`}
          disabled={value >= max || disabled}
          onClick={() => onChange(value + 1)}
        >
          <Plus />
        </Button>
      </div>
    </div>
  )
}

/** Primary + back actions. Sticks to the bottom of the screen on phones so the thumb reaches it. */
function StepActions({
  primary,
  pending,
  onBack,
  backLabel = "ย้อนกลับ",
  submit = false,
  onPrimary,
}: {
  primary: string
  pending?: boolean
  onBack: () => void
  backLabel?: string
  submit?: boolean
  onPrimary?: () => void
}) {
  return (
    <div className="sticky bottom-0 z-20 -mx-5 mt-5 bg-[#FFFCF8] px-5 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] sm:static sm:mx-0 sm:px-0 sm:pb-0">
      <Button
        type={submit ? "submit" : "button"}
        disabled={pending}
        className="h-12 w-full rounded-full text-base"
        onClick={submit ? undefined : onPrimary}
      >
        {primary}
      </Button>
      <button
        type="button"
        disabled={pending}
        className="mt-1 flex min-h-11 w-full items-center justify-center text-sm text-muted-foreground disabled:opacity-50"
        onClick={onBack}
      >
        {backLabel}
      </button>
    </div>
  )
}

function FieldError({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null
  return (
    <p id={id} className="mt-2 text-sm text-destructive">
      {children}
    </p>
  )
}

function StepCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col justify-center">
      <div className="relative mx-auto mt-[5.75rem] w-full max-w-md sm:mt-32">
        <CouplePeek />
        <div className="relative z-10 rounded-[1.75rem] border border-[#E6D5C3] bg-[#FFFCF8] px-5 pt-6 pb-4 shadow-[0_24px_50px_-32px_rgba(90,62,48,0.45)] sm:px-7 sm:pt-8 sm:pb-6">
          {children}
        </div>
      </div>
    </div>
  )
}

export type IdentifyResult = "saved" | "continue" | "need-name" | "wrong-name" | "locked"

function PhoneStep({
  initialValue,
  onSubmit,
  onBack,
}: {
  initialValue: string
  onSubmit: (phone: string, name?: string) => Promise<IdentifyResult>
  onBack: () => void
}) {
  const [value, setValue] = useState(initialValue)
  const [name, setName] = useState("")
  const [needName, setNeedName] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (pending) return
    const phone = normalizeThaiMobile(value)
    if (!phone) {
      setError("กรุณากรอกเบอร์มือถือไทย 10 หลัก ขึ้นต้นด้วย 06, 08 หรือ 09")
      return
    }
    if (needName && !name.trim()) {
      setError("กรุณากรอกชื่อที่ใช้ตอนลงทะเบียน")
      return
    }
    setPending(true)
    setError(null)
    try {
      const result = await onSubmit(phone, needName ? name : undefined)
      if (result === "need-name") {
        setNeedName(true)
        window.setTimeout(() => document.getElementById("verify-name")?.focus(), 50)
      } else if (result === "wrong-name") {
        setError("ชื่อไม่ตรงกับที่ลงทะเบียนไว้ ลองพิมพ์ให้ตรงกับตอนลงทะเบียนอีกครั้ง")
      } else if (result === "locked") {
        setError("ลองหลายครั้งเกินไป รอ 15 นาทีแล้วลองใหม่ หรือติดต่อบ่าวสาวเพื่อแก้ไข")
      }
      setPending(false)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "เปิดข้อมูลไม่สำเร็จ")
      setPending(false)
    }
  }

  return (
    <StepCard>
      <form onSubmit={handleSubmit} noValidate>
        <h1 id="register-step-title" tabIndex={-1} className="text-center font-serif text-2xl text-ink outline-none">
          เบอร์มือถือ
        </h1>
        <p id="phone-hint" className="mt-3 text-center text-sm leading-6 text-muted-foreground">
          {needName
            ? "เบอร์นี้ลงทะเบียนไว้แล้ว กรอกชื่อที่ใช้ตอนลงทะเบียนเพื่อเปิดคำตอบ"
            : "กรอกเบอร์มือถือเพื่อตอบรับ หรือเปิดคำตอบที่บันทึกไว้"}
        </p>
        <Label htmlFor="phone" className="mt-4">
          เบอร์มือถือ
        </Label>
        <Input
          id="phone"
          name="tel"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="08X-XXX-XXXX"
          value={value}
          aria-invalid={error && !needName ? true : undefined}
          aria-describedby={error ? "phone-error phone-hint" : "phone-hint"}
          className="mt-2 h-12 scroll-mb-40 rounded-2xl bg-card px-4 text-base leading-normal md:text-base"
          onChange={(event) => {
            setValue(maskPhoneInput(event.target.value))
            setNeedName(false)
            setName("")
            if (error) setError(null)
          }}
        />
        {needName ? (
          <>
            <Label htmlFor="verify-name" className="mt-4">
              ชื่อที่บ่าวสาวรู้จัก (ที่เคยลงไว้)
            </Label>
            <Input
              id="verify-name"
              value={name}
              maxLength={40}
              autoComplete="name"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "phone-error" : undefined}
              className="mt-2 h-12 scroll-mb-40 rounded-2xl bg-card px-4 text-base leading-normal md:text-base"
              onChange={(event) => {
                setName(event.target.value)
                if (error) setError(null)
              }}
            />
          </>
        ) : null}
        {error ? (
          <p id="phone-error" role="alert" className="mt-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="mt-6 h-12 w-full rounded-full text-base">
          {pending ? "กำลังเปิด…" : needName ? "เปิดคำตอบ" : "ต่อไป"}
        </Button>
        <button
          type="button"
          disabled={pending}
          className="mt-1 flex min-h-11 w-full items-center justify-center text-sm text-muted-foreground disabled:opacity-50"
          onClick={onBack}
        >
          ย้อนกลับ
        </button>
      </form>
    </StepCard>
  )
}

function RegisterIntro({
  editing,
  phone,
  onAdvance,
  onChangePhone,
}: {
  editing: boolean
  phone: string
  onAdvance: () => void
  onChangePhone: () => void
}) {
  const { frame, setLoop, playOnce } = useCoupleJumpPlayback()
  const leaving = useRef(false)

  useEffect(() => {
    for (const src of [COUPLE_PEEK.groom, COUPLE_PEEK.bride]) {
      const image = new Image()
      image.src = src
    }
  }, [])

  function enter() {
    if (leaving.current) return
    leaving.current = true
    playOnce(onAdvance)
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5">
      <WelcomeScene jumpFrame={frame} compact />
      <div className="flex w-full max-w-xs flex-col items-center">
        {editing ? <p className="mb-3 text-center text-sm text-muted-foreground">แก้คำตอบที่บันทึกไว้</p> : null}
        <Button
          type="button"
          className="h-14 w-full rounded-full bg-blush text-lg text-secondary-foreground shadow-none hover:bg-rose hover:text-paper focus-visible:border-rose/40 focus-visible:ring-rose/40"
          onPointerEnter={() => setLoop(true)}
          onPointerLeave={() => setLoop(false)}
          onClick={enter}
        >
          ลงทะเบียน
        </Button>
        <button
          type="button"
          className="mt-2 flex min-h-11 w-full items-center justify-center text-sm text-muted-foreground"
          onClick={onChangePhone}
        >
          {formatThaiMobile(phone)} · ใช้เบอร์อื่น
        </button>
      </div>
    </div>
  )
}

function ReviewRow({ label, value, onEdit }: { label: string; value: ReactNode; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#E6D5C3] py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-[13px] leading-normal text-muted-foreground">{label}</p>
        <div className="mt-0.5 text-[15px] leading-normal text-ink">{value}</div>
      </div>
      <button
        type="button"
        className="min-h-11 shrink-0 px-2 text-sm font-medium text-ink underline underline-offset-4"
        onClick={onEdit}
      >
        แก้
      </button>
    </div>
  )
}

const TRAVEL_CHOICES: TravelMode[] = ["drive", "taxi", "transit", "dropoff"]

const STEP_META: Record<Exclude<Stage, "phone" | "intro">, { label: string; icon: string }> = {
  attend: { label: "ตอบรับ", icon: stepIcon("step-rsvp") },
  about: { label: "เกี่ยวกับคุณ", icon: stepIcon("step-about") },
  travel: { label: "การเดินทาง", icon: stepIcon("step-travel-car") },
  review: { label: "ตรวจทาน", icon: stepIcon("step-review") },
}

export type SubmitError = Error & { code?: string; data?: Record<string, unknown> }

export function RsvpForm({
  phone,
  lastPhone,
  party,
  urlStep,
  onNavigate,
  onIdentify,
  onSubmit,
  onLeave,
}: {
  phone: string | null
  /** Last phone typed on this device, prefilled when there is no session. */
  lastPhone?: string | null
  party: Party | null
  /** `?step=` from the URL. The URL is the source of truth so the device back button walks the steps. */
  urlStep: string | null
  /** Push a new `?step=`. `intro` clears it. */
  onNavigate: (stage: Stage) => void
  onIdentify: (phone: string, name?: string) => Promise<IdentifyResult>
  onSubmit: (party: Party) => void | Promise<void>
  onLeave: () => void
}) {
  const editing = Boolean(party?.guests.length)
  const [initial] = useState<FormState>(() => (editing ? fromParty(party) : readDraft(phone) ?? fromParty(party)))
  const activePhone = useRef(phone)
  const [person, setPerson] = useState<Draft>(initial.person)
  const [adults, setAdults] = useState(initial.adults)
  const [kids, setKids] = useState(initial.kids)
  const [travel, setTravel] = useState<Travel>(initial.travel)
  const [errors, setErrors] = useState<Errors>({})
  const [summary, setSummary] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const declined = person.attendance === "declined"
  const companions = declined ? 0 : adults + kids
  const partySize = 1 + companions

  const aboutOk = Boolean(person.name.trim() && person.side && person.gender)
  const travelOk =
    travel.mode !== null &&
    (travel.mode !== "drive" || travel.needsParking !== null) &&
    (!(travel.mode === "drive" && travel.needsParking) || (travel.cars.length > 0 && travel.cars.every((car) => car.plate.trim())))

  function guard(target: Stage): Stage {
    if (target === "attend") return "attend"
    if (!person.attendance) return "attend"
    if (target === "about") return "about"
    if (!aboutOk) return "about"
    if (target === "travel") return declined ? "review" : "travel"
    if (!declined && !travelOk) return "travel"
    return "review"
  }

  const stage: Stage = !phone
    ? "phone"
    : urlStep === "phone"
      ? "phone"
      : urlStep && (FORM_STAGES as string[]).includes(urlStep)
        ? guard(urlStep as Stage)
        : "intro"

  useEffect(() => {
    if (stage === "intro") return
    document.getElementById("register-step-title")?.focus()
  }, [stage])

  useEffect(() => {
    if (editing) return
    writeDraft(activePhone.current, { person, adults, kids, travel })
  }, [editing, person, adults, kids, travel])

  function go(target: Stage) {
    onNavigate(target === "phone" || target === "intro" ? target : guard(target))
  }

  function resetDraft() {
    const fresh = fromParty(null)
    setPerson(fresh.person)
    setAdults(0)
    setKids(0)
    setTravel(NO_TRAVEL)
    setErrors({})
    setSummary(null)
  }

  async function identify(nextPhone: string, name?: string): Promise<IdentifyResult> {
    const result = await onIdentify(nextPhone, name)
    if (result !== "continue") return result
    if (activePhone.current !== nextPhone) {
      activePhone.current = nextPhone
      resetDraft()
      const stored = readDraft(nextPhone)
      if (stored) {
        setPerson(stored.person)
        setAdults(stored.adults)
        setKids(stored.kids)
        setTravel(stored.travel)
      }
    }
    onNavigate("attend")
    return "continue"
  }

  function backFromPhone() {
    if (phone && party) {
      onNavigate("intro")
      return
    }
    onLeave()
  }

  function patch(next: Partial<Draft>) {
    setPerson((current) => ({ ...current, ...next }))
    setErrors((current) => {
      const cleared = { ...current }
      for (const key of Object.keys(next)) delete cleared[key as keyof Errors]
      return cleared
    })
    setSummary(null)
  }

  function patchTravel(next: Partial<Travel>) {
    setTravel((current) => {
      const merged = { ...current, ...next }
      if (merged.mode !== "drive") merged.needsParking = null
      if (!(merged.mode === "drive" && merged.needsParking)) merged.cars = []
      else if (merged.cars.length === 0) merged.cars = [blankCar()]
      return merged
    })
    setErrors((current) => ({ ...current, mode: undefined, parking: undefined }))
    setSummary(null)
  }

  function patchCar(id: string, next: Partial<Car>) {
    setTravel((current) => ({ ...current, cars: current.cars.map((car) => (car.id === id ? { ...car, ...next } : car)) }))
    setErrors((current) => {
      if (!current.cars?.[id]) return current
      const cars = { ...current.cars }
      delete cars[id]
      return { ...current, cars }
    })
  }

  function chooseAttendance(attendance: Attendance) {
    patch({ attendance })
    if (attendance === "declined") {
      setAdults(0)
      setKids(0)
      setTravel(NO_TRAVEL)
    }
    window.setTimeout(() => onNavigate("about"), 250)
  }

  function checkAbout() {
    const next: Errors = {}
    if (!person.name.trim()) next.name = "กรุณากรอกชื่อที่บ่าวสาวรู้จัก"
    if (!person.side) next.side = "กรุณาเลือกฝั่ง"
    if (!person.gender) next.gender = "กรุณาเลือกเพศ"
    setErrors(next)
    if (next.name) document.getElementById("name-main")?.focus()
    return Object.keys(next).length === 0
  }

  function checkTravel() {
    const next: Errors = {}
    if (!travel.mode) next.mode = "กรุณาเลือกวิธีมาร่วมงาน"
    else if (travel.mode === "drive" && travel.needsParking === null) next.parking = "กรุณาเลือกว่าต้องการที่จอดรถไหม"
    if (travel.mode === "drive" && travel.needsParking) {
      const cars: Record<string, string> = {}
      const seen = new Set<string>()
      for (const car of travel.cars) {
        const norm = normalizePlate(car.plate)
        if (!norm) cars[car.id] = "กรุณากรอกทะเบียนรถ"
        else if (seen.has(`${norm}|${car.province}`)) cars[car.id] = "ทะเบียนนี้กรอกซ้ำแล้ว"
        seen.add(`${norm}|${car.province}`)
      }
      if (Object.keys(cars).length) next.cars = cars
    }
    setErrors(next)
    return !next.mode && !next.parking && !next.cars
  }

  function buildParty(): Party | null {
    if (!phone) {
      onNavigate("phone")
      return null
    }
    if (!person.attendance) {
      onNavigate("attend")
      return null
    }
    if (!checkAbout()) {
      onNavigate("about")
      return null
    }
    if (!declined && !checkTravel()) {
      onNavigate("travel")
      return null
    }
    const main: Guest = {
      id: person.id,
      name: person.name.trim(),
      gender: person.gender as Gender,
      ageGroup: "adult",
      attendance: person.attendance,
      side: person.side as FamilySide,
      partyPhone: phone,
    }
    return {
      phone,
      updatedAt: new Date().toISOString(),
      guests: [main, ...buildCompanions(declined ? 0 : adults, declined ? 0 : kids, phone, main, party?.guests ?? [])],
      travel: declined ? NO_TRAVEL : travel,
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    const next = buildParty()
    if (!next) return
    setSaving(true)
    setSummary(null)
    try {
      await onSubmit(next)
      clearDraft(phone)
    } catch (caught) {
      const error = caught as SubmitError
      if (error.code === "plate-taken") {
        const car = travel.cars.find(
          (item) => normalizePlate(item.plate) === error.data?.plate && item.province === error.data?.province
        )
        if (car) setErrors((current) => ({ ...current, cars: { ...current.cars, [car.id]: error.message } }))
        onNavigate("travel")
        if (car) {
          // After the step opens (title focus runs first), bring the taken plate above the sticky actions.
          window.setTimeout(() => {
            const input = document.getElementById(`plate-${car.id}`)
            input?.focus({ preventScroll: true })
            input?.scrollIntoView({ block: "center", behavior: "smooth" })
          }, 350)
        }
      } else {
        setSummary(error.message || "บันทึกไม่สำเร็จ")
      }
    } finally {
      setSaving(false)
    }
  }

  const steps: StepperItem[] = stepsFor(person.attendance).map((key) => ({
    key,
    ...STEP_META[key as keyof typeof STEP_META],
    ...(key === "travel" && travel.mode ? { icon: travelIcon(travel.mode) } : {}),
  }))
  const stepper = <FormStepper steps={steps} current={stage} onJump={(key) => go(key as Stage)} />

  return (
    <ScreenShell width="max-w-lg" className="px-4 py-3 sm:px-6 sm:py-8">
      <div className="flex flex-1 flex-col" data-register-stage={stage}>
        {stage === "phone" ? (
          <PhoneStep
            key={phone ?? "new"}
            initialValue={phone ? formatThaiMobile(phone) : lastPhone ? formatThaiMobile(lastPhone) : ""}
            onSubmit={identify}
            onBack={backFromPhone}
          />
        ) : null}

        {stage === "intro" && phone ? (
          <RegisterIntro
            editing={editing}
            phone={phone}
            onAdvance={() => onNavigate(editing ? "review" : "attend")}
            onChangePhone={() => onNavigate("phone")}
          />
        ) : null}

        {stage === "attend" ? (
          <StepCard>
            {stepper}
            <h1 id="register-step-title" tabIndex={-1} className="mt-4 text-center font-serif text-2xl text-ink outline-none">
              จะมาร่วมงานไหม
            </h1>
            <div className="mt-5">
              <Choice
                legend="การเข้าร่วมงาน"
                name="attendance-main"
                stacked
                value={person.attendance}
                onChange={chooseAttendance}
                options={[
                  { value: "attending", label: "เข้าร่วม" },
                  { value: "unsure", label: "ยังไม่แน่ใจ" },
                  { value: "declined", label: "ไปไม่ได้" },
                ]}
              />
              <FieldError>{errors.attendance}</FieldError>
            </div>
            <StepActions
              primary="ต่อไป"
              onPrimary={() => {
                if (!person.attendance) {
                  setErrors({ attendance: "กรุณาเลือกว่าจะมาร่วมงานหรือไม่" })
                  return
                }
                go("about")
              }}
              onBack={() => onNavigate(party ? "intro" : "phone")}
            />
          </StepCard>
        ) : null}

        {stage === "about" ? (
          <StepCard>
            {stepper}
            <h1 id="register-step-title" tabIndex={-1} className="mt-4 text-center font-serif text-2xl text-ink outline-none">
              เกี่ยวกับคุณ
            </h1>
            <div className="mt-4 flex flex-col gap-4">
              <div>
                <Label htmlFor="name-main">ชื่อที่บ่าวสาวรู้จัก</Label>
                <Input
                  id="name-main"
                  value={person.name}
                  maxLength={40}
                  placeholder="เช่น ชื่อเล่น"
                  autoComplete="name"
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={errors.name ? "error-name" : undefined}
                  className="mt-2 h-12 scroll-mb-40 rounded-2xl bg-card px-4 text-base leading-normal md:text-base"
                  onChange={(event) => patch({ name: event.target.value })}
                />
                <FieldError id="error-name">{errors.name}</FieldError>
              </div>
              <div>
                <Choice
                  legend="มาฝั่งไหน"
                  name="side-main"
                  value={person.side}
                  onChange={(side) => patch({ side })}
                  options={[
                    { value: "groom", label: `ฝั่ง${COUPLE.groomNickname}` },
                    { value: "bride", label: `ฝั่ง${COUPLE.brideNickname}` },
                  ]}
                />
                <FieldError>{errors.side}</FieldError>
              </div>
              <div>
                <Choice
                  legend="เพศ"
                  name="gender-main"
                  value={person.gender}
                  onChange={(gender) => patch({ gender })}
                  options={[
                    { value: "male", label: "ชาย" },
                    { value: "female", label: "หญิง" },
                    { value: "other", label: "อื่น ๆ" },
                  ]}
                />
                <p className="mt-2 text-[13px] leading-normal text-muted-foreground">ใช้เลือกตัวในฉากงาน</p>
                <FieldError>{errors.gender}</FieldError>
              </div>
              {declined ? null : (
                <div className="flex flex-col gap-3 rounded-2xl bg-[#F7F1E4] p-3">
                  <Counter
                    label="ผู้ติดตาม (ผู้ใหญ่)"
                    hint="ไม่ต้องกรอกชื่อ"
                    value={adults}
                    min={0}
                    max={COMPANION_MAX - kids}
                    onChange={setAdults}
                  />
                  <Counter label="เด็ก" value={kids} min={0} max={COMPANION_MAX - adults} onChange={setKids} />
                  <p className="text-[13px] leading-normal text-muted-foreground">รวมคุณด้วย {partySize} คน</p>
                </div>
              )}
            </div>
            <StepActions
              primary="ต่อไป"
              onPrimary={() => {
                if (checkAbout()) go(declined ? "review" : "travel")
              }}
              onBack={() => go("attend")}
            />
          </StepCard>
        ) : null}

        {stage === "travel" ? (
          <StepCard>
            {stepper}
            <h1 id="register-step-title" tabIndex={-1} className="mt-4 text-center font-serif text-2xl text-ink outline-none">
              จะมาร่วมงานยังไง
            </h1>
            <fieldset className="mt-4">
              <legend className="sr-only">วิธีเดินทาง</legend>
              <div className="grid grid-cols-2 gap-2.5">
                {TRAVEL_CHOICES.map((mode) => {
                  const selected = travel.mode === mode
                  return (
                    <label
                      key={mode}
                      className={cn(
                        "flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-3 text-center text-[14px] leading-tight transition-colors",
                        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                        selected ? "border-2 border-[#5C3A26] bg-[#F7F1E4] font-semibold" : "border-[#D8C8AC] bg-card"
                      )}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        name="travel-mode"
                        value={mode}
                        checked={selected}
                        onChange={() => patchTravel({ mode })}
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element -- pixel sprite */}
                      <img src={travelIcon(mode)} alt="" width={48} height={48} className="size-12 [image-rendering:pixelated]" />
                      {travelLabel(mode)}
                    </label>
                  )
                })}
              </div>
              {person.attendance === "unsure" ? (
                <label
                  className={cn(
                    "mt-2.5 flex min-h-11 cursor-pointer items-center justify-center rounded-2xl border px-3 text-[14px]",
                    travel.mode === "unknown" ? "border-2 border-[#5C3A26] bg-[#F7F1E4] font-semibold" : "border-[#D8C8AC] bg-card"
                  )}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    name="travel-mode"
                    value="unknown"
                    checked={travel.mode === "unknown"}
                    onChange={() => patchTravel({ mode: "unknown" })}
                  />
                  ยังไม่รู้ ไว้ค่อยอัปเดต
                </label>
              ) : null}
              <FieldError>{errors.mode}</FieldError>
            </fieldset>

            {travel.mode === "drive" ? (
              <div className="mt-5 motion-safe:animate-in motion-safe:fade-in">
                <Choice
                  legend="ต้องการที่จอดรถไหม"
                  name="needs-parking"
                  value={travel.needsParking === null ? null : travel.needsParking ? "yes" : "no"}
                  onChange={(value) => patchTravel({ needsParking: value === "yes" })}
                  options={[
                    { value: "yes", label: "ต้องการ" },
                    { value: "no", label: "ไม่ต้องการ" },
                  ]}
                />
                <FieldError>{errors.parking}</FieldError>
              </div>
            ) : null}

            {travel.mode === "drive" && travel.needsParking ? (
              <div className="mt-4 flex flex-col gap-3">
                {travel.cars.map((car, index) => {
                  const norm = normalizePlate(car.plate)
                  const error = errors.cars?.[car.id]
                  return (
                    <div key={car.id} className="rounded-2xl border border-[#E6D5C3] bg-card p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[15px] font-medium">รถคันที่ {index + 1}</p>
                        {travel.cars.length > 1 ? (
                          <button
                            type="button"
                            className="grid size-11 place-items-center text-muted-foreground"
                            aria-label={`ลบรถคันที่ ${index + 1}`}
                            onClick={() => setTravel((current) => ({ ...current, cars: current.cars.filter((item) => item.id !== car.id) }))}
                          >
                            <X className="size-4" />
                          </button>
                        ) : null}
                      </div>
                      <div className="mt-1 grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-2">
                        <div>
                          <Label htmlFor={`plate-${car.id}`}>ทะเบียน</Label>
                          <Input
                            id={`plate-${car.id}`}
                            value={car.plate}
                            maxLength={12}
                            placeholder="1กข 1234"
                            aria-invalid={error ? true : undefined}
                            aria-describedby={error ? `plate-error-${car.id}` : undefined}
                            className="mt-1.5 h-12 scroll-mb-40 rounded-2xl bg-background px-3 text-base md:text-base"
                            onChange={(event) => patchCar(car.id, { plate: event.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`province-${car.id}`}>จังหวัด</Label>
                          <select
                            id={`province-${car.id}`}
                            value={car.province}
                            className="mt-1.5 h-12 w-full rounded-2xl border border-input bg-background px-2.5 text-[15px]"
                            onChange={(event) => patchCar(car.id, { province: event.target.value })}
                          >
                            {PROVINCES.map((province) => (
                              <option key={province} value={province}>
                                {province}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {error ? (
                        <FieldError id={`plate-error-${car.id}`}>{error}</FieldError>
                      ) : norm && !looksLikePlate(norm) ? (
                        <p className="mt-2 text-[13px] text-muted-foreground">รูปแบบทะเบียนดูไม่คุ้น ตรวจอีกครั้ง (ป้ายพิเศษใส่ได้)</p>
                      ) : null}
                    </div>
                  )
                })}
                {travel.cars.length < CAR_MAX ? (
                  <button
                    type="button"
                    className="flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-dashed border-[#D8C8AC] text-sm font-medium"
                    onClick={() => setTravel((current) => ({ ...current, cars: [...current.cars, blankCar()] }))}
                  >
                    <Plus className="size-4" /> เพิ่มรถอีกคัน
                  </button>
                ) : null}
              </div>
            ) : null}

            <a
              href={VENUE_MAP.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex items-start gap-2.5 rounded-2xl bg-[#F7F1E4] p-3 text-[13px] leading-normal"
            >
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                <span className="block text-[14px] font-medium text-ink">
                  {VENUE_MAP.name} · {VENUE_MAP.area}
                </span>
                แถวบางรักที่จอดรถมีจำกัด <span className="underline underline-offset-4">เปิดแผนที่</span>
              </span>
            </a>

            <StepActions
              primary="ต่อไป"
              onPrimary={() => {
                if (checkTravel()) go("review")
              }}
              onBack={() => go("about")}
            />
          </StepCard>
        ) : null}

        {stage === "review" ? (
          <StepCard>
            <form onSubmit={handleSubmit} noValidate>
              {stepper}
              <h1 id="register-step-title" tabIndex={-1} className="mt-4 text-center font-serif text-2xl text-ink outline-none">
                ตรวจทานคำตอบ
              </h1>
              <div className="mt-3">
                <ReviewRow
                  label="การเข้าร่วม"
                  value={person.attendance ? attendanceLabel(person.attendance) : "-"}
                  onEdit={() => go("attend")}
                />
                <ReviewRow
                  label="เกี่ยวกับคุณ"
                  value={
                    <>
                      {person.name.trim()} · ฝั่ง{person.side === "groom" ? COUPLE.groomNickname : COUPLE.brideNickname}
                      {declined ? null : (
                        <span className="block text-[13px] text-muted-foreground">
                          มา {partySize} คน{kids ? ` (เด็ก ${kids})` : ""}
                        </span>
                      )}
                    </>
                  }
                  onEdit={() => go("about")}
                />
                {declined ? null : (
                  <ReviewRow
                    label="การเดินทาง"
                    value={
                      <>
                        {travel.mode ? travelLabel(travel.mode) : "-"}
                        {travel.mode === "drive" ? (
                          <span className="block text-[13px] text-muted-foreground">
                            {travel.needsParking
                              ? `ที่จอด ${travel.cars.length} คัน · ${travel.cars.map((car) => `${car.plate.trim()} ${car.province}`).join(", ")}`
                              : "ไม่ต้องการที่จอด"}
                          </span>
                        ) : null}
                      </>
                    }
                    onEdit={() => go("travel")}
                  />
                )}
              </div>
              {declined ? null : (
                <div
                  role="note"
                  className="mt-4 flex items-start gap-3 rounded-2xl border-2 border-[#A3B18A] bg-[#F4F6EE] px-4 py-3"
                >
                  <span aria-hidden="true" className="text-2xl leading-none">
                    👔
                  </span>
                  <div>
                    <p className="text-[15px] leading-normal font-semibold text-[#5C3A26]">{DRESS_CODE.title}</p>
                    <p className="mt-0.5 text-[13.5px] leading-relaxed text-[#5C3A26]">{DRESS_CODE.detail}</p>
                  </div>
                </div>
              )}
              {summary ? (
                <p role="alert" className="mt-3 text-sm text-destructive">
                  {summary}
                </p>
              ) : null}
              <StepActions
                submit
                pending={saving}
                primary={saving ? "กำลังบันทึก…" : editing ? "บันทึก" : "บันทึกและเข้างาน"}
                onBack={() => go(declined ? "about" : "travel")}
              />
            </form>
          </StepCard>
        ) : null}
      </div>
    </ScreenShell>
  )
}
