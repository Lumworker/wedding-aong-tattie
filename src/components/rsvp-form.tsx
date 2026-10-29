"use client"

import { FormEvent, useEffect, useRef, useState, type ReactNode } from "react"
import { Minus, Plus } from "lucide-react"
import { Choice } from "@/components/choice"
import { CouplePeek } from "@/components/couple-peek"
import { FormStepper } from "@/components/form-stepper"
import { ScreenShell } from "@/components/screen-shell"
import { WelcomeScene } from "@/components/welcome-scene"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCoupleJumpPlayback } from "@/components/venue/character"
import { COUPLE_PEEK } from "@/lib/couple-atlas"
import { COUPLE, PARTY_MAX } from "@/lib/event"
import { newId } from "@/lib/id"
import { formatThaiMobile, maskPhoneInput, normalizeThaiMobile } from "@/lib/phone"
import type { Attendance, FamilySide, Gender, Guest, Party } from "@/lib/types"

const COMPANION_MAX = PARTY_MAX - 1

type Stage = "phone" | "intro" | "attend" | "details"

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
}

function blank(): Draft {
  return {
    id: newId("guest"),
    name: "",
    gender: null,
    attendance: null,
    side: null,
  }
}

function fromParty(party: Party | null): { person: Draft; companions: number } {
  if (!party?.guests.length) return { person: blank(), companions: 0 }
  const main = party.guests.find((guest) => !guest.isCompanion) ?? party.guests[0]
  const companions = party.guests.filter((guest) => guest.isCompanion || guest.id !== main.id).length
  return {
    person: {
      id: main.id,
      name: main.name,
      gender: main.gender,
      attendance: main.attendance,
      side: main.side ?? null,
    },
    companions: Math.min(COMPANION_MAX, Math.max(0, companions)),
  }
}

function buildCompanions(
  count: number,
  phone: string,
  template: Pick<Guest, "attendance" | "side">,
  existing: Guest[]
): Guest[] {
  const kept = existing.filter((guest) => guest.isCompanion).slice(0, count)
  while (kept.length < count) {
    kept.push({
      id: newId("guest"),
      name: "ผู้ติดตาม",
      gender: "other",
      ageGroup: "adult",
      attendance: template.attendance,
      side: template.side,
      partyPhone: phone,
      isCompanion: true,
    })
  }
  return kept.map((guest, index) => ({
    ...guest,
    name: count === 1 ? "ผู้ติดตาม" : `ผู้ติดตาม ${index + 1}`,
    gender: "other" as const,
    ageGroup: "adult" as const,
    attendance: template.attendance,
    side: template.side,
    partyPhone: phone,
    isCompanion: true,
  }))
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

function PhoneStep({
  initialValue,
  onSubmit,
  onBack,
}: {
  initialValue: string
  onSubmit: (phone: string) => Promise<void>
  onBack: () => void
}) {
  const [value, setValue] = useState(initialValue)
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
    setPending(true)
    setError(null)
    try {
      await onSubmit(phone)
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
          กรอกเบอร์มือถือเพื่อตอบรับ หรือเปิดคำตอบที่บันทึกไว้
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
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "phone-error phone-hint" : "phone-hint"}
          className="mt-2 h-12 scroll-mb-40 rounded-2xl bg-card px-4 text-base leading-normal md:text-base"
          onChange={(event) => {
            setValue(maskPhoneInput(event.target.value))
            if (error) setError(null)
          }}
        />
        {error ? (
          <p id="phone-error" role="alert" className="mt-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="mt-6 h-12 w-full rounded-full text-base">
          {pending ? "กำลังเปิด…" : "ต่อไป"}
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

export function RsvpForm({
  phone,
  party,
  startAtPhone,
  onIdentify,
  onSubmit,
  onLeave,
}: {
  phone: string | null
  party: Party | null
  /** Welcome CTA and a missing session both open the phone step before attendance. */
  startAtPhone: boolean
  onIdentify: (phone: string) => Promise<"continue" | "saved">
  onSubmit: (party: Party) => void | Promise<void>
  onLeave: () => void
}) {
  const initial = fromParty(party)
  const editing = Boolean(party?.guests.length)
  const [stage, setStage] = useState<Stage>(startAtPhone || !phone ? "phone" : "intro")
  const resumed = useRef(stage === "intro")
  const activePhone = useRef(phone)
  const [person, setPerson] = useState<Draft>(initial.person)
  const [companions, setCompanions] = useState(initial.companions)
  const [errors, setErrors] = useState<Errors>({})
  const [summary, setSummary] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const partySize = 1 + companions

  useEffect(() => {
    if (stage === "intro") return
    document.getElementById("register-step-title")?.focus()
  }, [stage])

  function resetDraft() {
    const blankDraft = fromParty(null)
    setPerson(blankDraft.person)
    setCompanions(0)
    setErrors({})
    setSummary(null)
  }

  async function identify(nextPhone: string) {
    const result = await onIdentify(nextPhone)
    if (result === "saved") return
    if (activePhone.current !== nextPhone) {
      activePhone.current = nextPhone
      resetDraft()
    }
    resumed.current = false
    setStage("attend")
  }

  function changeNumber() {
    setStage("phone")
  }

  function backFromPhone() {
    if (phone && resumed.current) {
      setStage("intro")
      return
    }
    onLeave()
  }

  function patch(next: Partial<Draft>) {
    setPerson((current) => ({ ...current, ...next }))
    setErrors((current) => {
      const cleared = { ...current }
      if (next.name !== undefined) delete cleared.name
      if (next.gender !== undefined) delete cleared.gender
      if (next.attendance !== undefined) delete cleared.attendance
      if (next.side !== undefined) delete cleared.side
      return cleared
    })
    setSummary(null)
  }

  function setCompanionCount(next: number) {
    setCompanions(Math.min(COMPANION_MAX, Math.max(0, next)))
    setSummary(null)
  }

  function goToDetails() {
    if (!person.attendance) {
      setErrors((current) => ({ ...current, attendance: "กรุณาเลือกว่าจะมาร่วมงานหรือไม่" }))
      return
    }
    setStage("details")
  }

  function buildMain() {
    if (!phone) {
      setSummary("กรุณากรอกเบอร์มือถือ")
      setStage("phone")
      return null
    }
    const nextErrors: Errors = {}
    if (!person.attendance) nextErrors.attendance = "กรุณาเลือกว่าจะมาร่วมงานหรือไม่"
    if (!person.name.trim()) nextErrors.name = "กรุณากรอกชื่อที่บ่าวสาวรู้จัก"
    if (!person.side) nextErrors.side = "กรุณาเลือกฝั่ง"
    if (!person.gender) nextErrors.gender = "กรุณาเลือกเพศ"
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setSummary("กรุณาตรวจสอบข้อมูลให้ครบ")
      if (nextErrors.name) document.getElementById("name-main")?.focus()
      return null
    }

    const main: Guest = {
      id: person.id,
      name: person.name.trim(),
      gender: person.gender as Gender,
      ageGroup: "adult",
      attendance: person.attendance as Attendance,
      side: person.side as FamilySide,
      partyPhone: phone,
    }
    return main
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    const main = buildMain()
    if (!main || !phone) return

    setSaving(true)
    setSummary(null)
    try {
      await onSubmit({
        phone,
        updatedAt: new Date().toISOString(),
        guests: [main, ...buildCompanions(companions, phone, main, party?.guests ?? [])],
      })
    } catch (error) {
      setSummary(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ")
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScreenShell width="max-w-lg" className="px-4 py-3 sm:px-6 sm:py-8">
      <div className="flex flex-1 flex-col" data-register-stage={stage}>
        {stage === "phone" ? (
          <PhoneStep
            key={phone ?? "new"}
            initialValue={phone ? formatThaiMobile(phone) : ""}
            onSubmit={identify}
            onBack={backFromPhone}
          />
        ) : null}

        {stage === "intro" && phone ? (
          <RegisterIntro editing={editing} phone={phone} onAdvance={() => setStage("attend")} onChangePhone={changeNumber} />
        ) : null}

        {stage === "attend" ? (
          <StepCard>
            <FormStepper current={1} />
            <h1 id="register-step-title" tabIndex={-1} className="mt-4 text-center font-serif text-2xl text-ink outline-none">
              การเข้าร่วมงาน
            </h1>
            <div className="mt-5">
              <Choice
                legend="จะมาร่วมงานหรือไม่"
                name="attendance-main"
                stacked
                value={person.attendance}
                onChange={(attendance) => patch({ attendance })}
                options={[
                  { value: "attending", label: "เข้าร่วม" },
                  { value: "unsure", label: "ยังไม่แน่ใจ" },
                  { value: "declined", label: "ไปไม่ได้" },
                ]}
              />
              {errors.attendance ? <p className="mt-2 text-sm text-destructive">{errors.attendance}</p> : null}
            </div>
            <Button type="button" className="mt-6 h-12 w-full rounded-full text-base" onClick={goToDetails}>
              ต่อไป
            </Button>
            <button
              type="button"
              className="mt-1 flex min-h-11 w-full items-center justify-center text-sm text-muted-foreground"
              onClick={() => setStage(resumed.current ? "intro" : "phone")}
            >
              ย้อนกลับ
            </button>
          </StepCard>
        ) : null}

        {stage === "details" ? (
          <StepCard>
            <form
              onSubmit={handleSubmit}
              noValidate
              onFocusCapture={(event) => {
                const target = event.target
                if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return
                window.setTimeout(() => target.scrollIntoView({ block: "center", behavior: "smooth" }), 300)
              }}
            >
              <FormStepper current={2} />
              <h1 id="register-step-title" tabIndex={-1} className="mt-4 text-center font-serif text-2xl text-ink outline-none">
                รายละเอียด
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
                  {errors.name ? (
                    <p id="error-name" className="mt-2 text-sm text-destructive">
                      {errors.name}
                    </p>
                  ) : null}
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
                  {errors.side ? <p className="mt-2 text-sm text-destructive">{errors.side}</p> : null}
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
                  {errors.gender ? <p className="mt-2 text-sm text-destructive">{errors.gender}</p> : null}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[15px] leading-normal font-medium">จำนวนผู้ติดตาม</p>
                    <p className="text-[13px] leading-6 text-muted-foreground">รวม {partySize} คน · ไม่ต้องกรอกชื่อ</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-11 min-h-11 min-w-11 rounded-full bg-card"
                      aria-label="ลดจำนวนผู้ติดตาม"
                      disabled={companions <= 0 || saving}
                      onClick={() => setCompanionCount(companions - 1)}
                    >
                      <Minus />
                    </Button>
                    <p className="w-8 text-center font-sans text-xl leading-normal font-bold tabular-nums text-ink" aria-live="polite">
                      {companions}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-11 min-h-11 min-w-11 rounded-full bg-card"
                      aria-label="เพิ่มจำนวนผู้ติดตาม"
                      disabled={companions >= COMPANION_MAX || saving}
                      onClick={() => setCompanionCount(companions + 1)}
                    >
                      <Plus />
                    </Button>
                  </div>
                </div>
              </div>

              {summary ? (
                <p role="alert" className="mt-4 text-sm text-destructive">
                  {summary}
                </p>
              ) : null}
              <Button type="submit" disabled={saving} className="mt-4 h-12 w-full rounded-full text-base">
                {saving ? "กำลังบันทึก…" : editing ? "บันทึก" : "บันทึกและเข้างาน"}
              </Button>
              <button
                type="button"
                disabled={saving}
                className="mt-1 flex min-h-11 w-full items-center justify-center text-sm text-muted-foreground disabled:opacity-50"
                onClick={() => setStage("attend")}
              >
                ย้อนกลับ
              </button>
            </form>
          </StepCard>
        ) : null}
      </div>
    </ScreenShell>
  )
}
