"use client"

import { FormEvent, useState } from "react"
import { Minus, Plus } from "lucide-react"
import { Choice } from "@/components/choice"
import { ScreenShell } from "@/components/screen-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { COUPLE, PARTY_MAX } from "@/lib/event"
import { newId } from "@/lib/id"
import type { Attendance, FamilySide, Gender, Guest, Party } from "@/lib/types"

const COMPANION_MAX = PARTY_MAX - 1

type Draft = {
  id: string
  name: string
  gender: Gender | null
  attendance: Attendance
  side: FamilySide | null
}

type Errors = {
  name?: string
  gender?: string
  side?: string
}

function blank(): Draft {
  return {
    id: newId("guest"),
    name: "",
    gender: null,
    attendance: "attending",
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
      attendance: normalizeAttendance(main.attendance),
      side: main.side ?? null,
    },
    companions: Math.min(COMPANION_MAX, Math.max(0, companions)),
  }
}

function normalizeAttendance(value: string): Attendance {
  return value === "attending" ? "attending" : "unsure"
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
      if (next.side !== undefined) delete cleared.side
      return cleared
    })
    setSummary(null)
  }

  function setCompanionCount(next: number) {
    setCompanions(Math.min(COMPANION_MAX, Math.max(0, next)))
    setSummary(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    const nextErrors: Errors = {}
    if (!person.name.trim()) nextErrors.name = "กรุณากรอกชื่อ"
    if (!person.gender) nextErrors.gender = "กรุณาเลือกเพศ"
    if (!person.side) nextErrors.side = "กรุณาเลือกฝั่งญาติ"
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setSummary("กรุณาตรวจสอบข้อมูลให้ครบ")
      document.getElementById("guest-main")?.scrollIntoView({ behavior: "smooth", block: "center" })
      if (nextErrors.name) document.getElementById("name-main")?.focus()
      return
    }

    const gender = person.gender as Gender
    const side = person.side as FamilySide
    const main: Guest = {
      id: person.id,
      name: person.name.trim(),
      gender,
      ageGroup: "adult",
      attendance: person.attendance,
      side,
      partyPhone: phone,
    }

    setSaving(true)
    setSummary(null)
    try {
      await onSubmit({
        phone,
        updatedAt: new Date().toISOString(),
        guests: [
          main,
          ...buildCompanions(companions, phone, main, party?.guests ?? []),
        ],
      })
    } catch (error) {
      setSummary(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ")
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScreenShell width="max-w-xl" className="px-4 sm:px-6">
      <header>
        <p className="text-[13px] font-medium tracking-[0.22em] text-rose uppercase">งานมงคลสมรส</p>
        <h1 className="mt-2 font-display text-4xl leading-snug text-ink sm:text-5xl">ตอบรับคำเชิญ</h1>
        <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
          กรอกข้อมูลของคุณ แล้วเพิ่มจำนวนผู้ติดตามได้ถ้ามี ผู้ติดตามไม่ต้องกรอกรายละเอียด — คณะละไม่เกิน {PARTY_MAX} คน (รวมคุณ)
        </p>
        {party?.guests.length ? (
          <p className="mt-2 text-sm leading-6 text-sage-deep">เคยบันทึกแล้ว ตรวจข้อมูลแล้วกดเข้างานได้</p>
        ) : null}
        <Button type="button" variant="secondary" className="mt-3 h-auto min-h-11 rounded-full px-4 py-2.5 text-[15px]" onClick={onChangePhone}>
          ใช้เบอร์อื่น
        </Button>
      </header>

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-1 flex-col"
        noValidate
        onFocusCapture={(event) => {
          const target = event.target
          if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return
          window.setTimeout(() => target.scrollIntoView({ block: "center", behavior: "smooth" }), 300)
        }}
      >
        <article
          id="guest-main"
          className="rounded-[1.6rem] border border-border bg-card p-4 shadow-[0_18px_50px_-36px_rgba(42,38,35,0.55)]"
        >
          <h2 className="mb-3 font-serif text-xl">ข้อมูลของคุณ</h2>
          <Label htmlFor="name-main">ชื่อ</Label>
          <Input
            id="name-main"
            value={person.name}
            maxLength={40}
            placeholder="ชื่อเล่นหรือชื่อจริง"
            autoComplete="name"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "error-name" : undefined}
            className="mt-2 h-12 scroll-mb-40 rounded-2xl bg-background px-4 text-base leading-normal md:text-base"
            onChange={(event) => patch({ name: event.target.value })}
          />
          {errors.name ? (
            <p id="error-name" className="mt-2 text-sm text-destructive">
              {errors.name}
            </p>
          ) : null}

          <div className="mt-4 flex flex-col gap-4">
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
            {errors.gender ? <p className="text-sm text-destructive">{errors.gender}</p> : null}

            <Choice
              legend="ญาติฝั่ง"
              name="side-main"
              value={person.side}
              onChange={(side) => patch({ side })}
              options={[
                { value: "groom", label: "ฝั่งเจ้าบ่าว", hint: COUPLE.groomNickname },
                { value: "bride", label: "ฝั่งเจ้าสาว", hint: COUPLE.brideNickname },
              ]}
            />
            {errors.side ? <p className="text-sm text-destructive">{errors.side}</p> : null}

            <Choice
              legend="การร่วมงาน"
              name="attendance-main"
              value={person.attendance}
              onChange={(attendance) => patch({ attendance })}
              options={[
                { value: "attending", label: "เข้าร่วมงาน", hint: "นั่งเพว์ในโบสถ์" },
                { value: "unsure", label: "ยังไม่แน่ใจ", hint: "แจ้งภายหลังได้" },
              ]}
            />
          </div>
        </article>

        <div className="mt-4 rounded-[1.6rem] border border-border bg-card px-4 py-4 shadow-[0_18px_50px_-36px_rgba(42,38,35,0.6)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">จำนวนผู้ติดตาม</p>
              <p className="text-[13px] leading-6 text-muted-foreground">
                ไม่ต้องกรอกข้อมูลผู้ติดตาม · ได้สูงสุด {COMPANION_MAX} คน (รวมคุณแล้วไม่เกิน {PARTY_MAX})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-11 min-h-11 min-w-11 rounded-full bg-background"
                aria-label="ลดจำนวนผู้ติดตาม"
                disabled={companions <= 0}
                onClick={() => setCompanionCount(companions - 1)}
              >
                <Minus />
              </Button>
              <p className="w-10 text-center font-sans text-xl leading-normal font-bold tabular-nums text-ink" aria-live="polite">
                {companions}
              </p>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-11 min-h-11 min-w-11 rounded-full bg-background"
                aria-label="เพิ่มจำนวนผู้ติดตาม"
                disabled={companions >= COMPANION_MAX}
                onClick={() => setCompanionCount(companions + 1)}
              >
                <Plus />
              </Button>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 z-10 -mx-4 mt-4 scroll-mb-8 border-t border-border bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0">
          {summary ? (
            <p role="alert" className="mb-2 text-sm text-destructive">
              {summary}
            </p>
          ) : (
            <p className="mb-2 text-sm text-muted-foreground" aria-live="polite">
              ทั้งคณะ {partySize} คน
              {companions > 0 ? ` · ผู้ติดตาม ${companions} คน` : ""}
              {person.attendance === "attending" ? " · ยืนยันเข้าร่วมงาน" : " · ยังไม่แน่ใจ"}
            </p>
          )}
          <Button type="submit" disabled={saving} className="h-auto min-h-12 w-full rounded-full py-3 text-base leading-normal">
            {saving ? "กำลังบันทึก…" : "บันทึกและเข้างาน"}
          </Button>
        </div>
      </form>
    </ScreenShell>
  )
}
