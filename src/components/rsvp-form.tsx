"use client"

import { FormEvent, useState } from "react"
import { Minus, Plus } from "lucide-react"
import { Choice } from "@/components/choice"
import { FormStepper } from "@/components/form-stepper"
import { ScreenShell } from "@/components/screen-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { COUPLE, PARTY_MAX } from "@/lib/event"
import { newId } from "@/lib/id"
import { formatThaiMobile } from "@/lib/phone"
import type { Attendance, FamilySide, Gender, Guest, Party } from "@/lib/types"

const COMPANION_MAX = PARTY_MAX - 1

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

export function RsvpForm({
  phone,
  party,
  onSubmit,
  onChangePhone,
}: {
  phone: string
  party: Party | null
  onSubmit: (party: Party) => void | Promise<void>
  onChangePhone: () => void
}) {
  const initial = fromParty(party)
  const editing = Boolean(party?.guests.length)
  const [person, setPerson] = useState<Draft>(initial.person)
  const [companions, setCompanions] = useState(initial.companions)
  const [errors, setErrors] = useState<Errors>({})
  const [summary, setSummary] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const partySize = 1 + companions

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

  function validatePerson() {
    const nextErrors: Errors = {}
    if (!person.attendance) nextErrors.attendance = "กรุณาเลือกว่าจะมาร่วมงานหรือไม่"
    if (!person.name.trim()) nextErrors.name = "กรุณากรอกชื่อที่บ่าวสาวรู้จัก"
    if (!person.side) nextErrors.side = "กรุณาเลือกฝั่ง"
    if (!person.gender) nextErrors.gender = "กรุณาเลือกเพศ"
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setSummary("กรุณาตรวจสอบข้อมูลให้ครบ")
      const anchor = nextErrors.attendance || nextErrors.name ? "guest-main" : "guest-visit"
      document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "center" })
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
    const main = validatePerson()
    if (!main) return

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
    <ScreenShell width="max-w-md" className="px-4 py-8 sm:px-6">
      <div className="my-auto">
        <FormStepper current={2} />
        <form
          onSubmit={handleSubmit}
          className="mt-8"
          noValidate
          onFocusCapture={(event) => {
            const target = event.target
            if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return
            window.setTimeout(() => target.scrollIntoView({ block: "center", behavior: "smooth" }), 300)
          }}
        >
          <h1 className="font-serif text-2xl text-ink">{editing ? "แก้คำตอบ" : "ตอบรับคำเชิญ"}</h1>
          {editing ? <p className="mt-2 text-sm leading-6 text-sage-deep">ตรวจคำตอบเดิม แล้วบันทึกได้เลย</p> : null}

          <div id="guest-main" className="mt-6 flex flex-col gap-5">
            <Choice
              legend="การร่วมงาน"
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
            {errors.attendance ? <p className="-mt-3 text-sm text-destructive">{errors.attendance}</p> : null}

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

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[15px] leading-normal font-medium">ผู้ติดตาม</p>
                <p className="text-[13px] leading-6 text-muted-foreground">รวม {partySize} คน · สถานะเดียวกับคุณ · ไม่ต้องกรอกชื่อ</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-11 min-h-11 min-w-11 rounded-full bg-card"
                  aria-label="ลดจำนวนผู้ติดตาม"
                  disabled={companions <= 0}
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
                  disabled={companions >= COMPANION_MAX}
                  onClick={() => setCompanionCount(companions + 1)}
                >
                  <Plus />
                </Button>
              </div>
            </div>
          </div>

          <div id="guest-visit" className="mt-6 flex flex-col gap-5 border-t border-border pt-6">
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
            {errors.side ? <p className="-mt-3 text-sm text-destructive">{errors.side}</p> : null}

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
          </div>

          {summary ? (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {summary}
            </p>
          ) : null}
          <Button type="submit" disabled={saving} className="mt-6 h-12 w-full rounded-full text-base">
            {saving ? "กำลังบันทึก…" : editing ? "บันทึก" : "บันทึกและเข้างาน"}
          </Button>
          <button
            type="button"
            disabled={saving}
            className="mt-1 flex min-h-11 w-full items-center justify-center text-sm text-muted-foreground disabled:opacity-50"
            onClick={onChangePhone}
          >
            {formatThaiMobile(phone)} · ใช้เบอร์อื่น
          </button>
        </form>
      </div>
    </ScreenShell>
  )
}
