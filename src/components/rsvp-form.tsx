"use client"

import { FormEvent, useState } from "react"
import { Minus, Plus } from "lucide-react"
import { PetalField } from "@/components/petal-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PARTY_MAX, PARTY_MIN } from "@/lib/event"
import type { AgeGroup, Attendance, Gender, Guest, Party } from "@/lib/types"
import { cn } from "@/lib/utils"

type DraftGuest = {
  id: string
  name: string
  gender: Gender | null
  ageGroup: AgeGroup
  attendance: Attendance
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function blankGuest(): DraftGuest {
  return {
    id: createId(),
    name: "",
    gender: null,
    ageGroup: "adult",
    attendance: "attending",
  }
}

function fromGuest(guest: Guest): DraftGuest {
  return {
    id: guest.id,
    name: guest.name,
    gender: guest.gender,
    ageGroup: guest.ageGroup,
    attendance: guest.attendance,
  }
}

function Choice<T extends string>({
  legend,
  name,
  value,
  onChange,
  options,
}: {
  legend: string
  name: string
  value: T | null
  onChange: (value: T) => void
  options: { value: T; label: string; hint?: string }[]
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <div className={cn("grid gap-2", options.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
        {options.map((option) => {
          const selected = value === option.value
          return (
            <label
              key={option.value}
              className={cn(
                "cursor-pointer rounded-2xl border px-2 py-3 text-center transition-colors",
                "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted"
              )}
            >
              <input
                type="radio"
                className="sr-only"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
              />
              <span className="block text-sm font-medium">{option.label}</span>
              {option.hint ? (
                <span className={cn("mt-0.5 block text-[11px] leading-4", selected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                  {option.hint}
                </span>
              ) : null}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export function RsvpForm({
  phone,
  party,
  onSubmit,
  onChangePhone,
}: {
  phone: string
  party: Party | null
  onSubmit: (party: Party) => void
  onChangePhone: () => void
}) {
  const initial = party?.guests?.length ? party.guests.map(fromGuest) : [blankGuest()]
  const [people, setPeople] = useState<DraftGuest[]>(initial)
  const [count, setCount] = useState(initial.length)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [summary, setSummary] = useState<string | null>(null)

  function setCountTo(next: number) {
    const clamped = Math.min(PARTY_MAX, Math.max(PARTY_MIN, next))
    setPeople((current) => {
      if (current.length >= clamped) return current
      return [...current, ...Array.from({ length: clamped - current.length }, blankGuest)]
    })
    setCount(clamped)
    setSummary(null)
  }

  function update(id: string, patch: Partial<DraftGuest>) {
    setPeople((current) => current.map((person) => (person.id === id ? { ...person, ...patch } : person)))
    setErrors((current) => {
      if (!current[id]) return current
      const next = { ...current }
      delete next[id]
      return next
    })
    setSummary(null)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const visible = people.slice(0, count)
    const nextErrors: Record<string, string> = {}
    for (const person of visible) {
      if (!person.name.trim()) nextErrors[person.id] = "กรุณากรอกชื่อ"
      else if (!person.gender) nextErrors[person.id] = "กรุณาเลือกเพศ"
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setSummary("กรุณาตรวจสอบชื่อและเพศของทุกคน")
      const firstId = visible.find((person) => nextErrors[person.id])?.id
      if (firstId) {
        document.getElementById(`guest-${firstId}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
        document.getElementById(`name-${firstId}`)?.focus()
      }
      return
    }

    onSubmit({
      phone,
      updatedAt: new Date().toISOString(),
      guests: visible.map((person) => ({
        id: person.id,
        name: person.name.trim(),
        gender: person.gender as Gender,
        ageGroup: person.ageGroup,
        attendance: person.attendance,
        partyPhone: phone,
      })),
    })
  }

  const visible = people.slice(0, count)
  const coming = visible.filter((person) => person.attendance === "attending").length

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 py-8 sm:px-6">
      <PetalField />
      <div className="relative z-10 flex flex-1 flex-col">
      <header>
        <p className="text-[11px] font-medium tracking-[0.28em] text-rose uppercase">งานมงคลสมรส</p>
        <h1 className="mt-2 font-display text-4xl leading-none text-ink sm:text-5xl">ตอบรับคำเชิญ</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          บอกเราว่าใครอยู่ในคณะนี้ จะได้พาทุกคนเข้าฉากงาน
          โบสถ์รองรับแขกทั้งงานได้กว่า 100 คน — แบบนี้เก็บเฉพาะคณะของคุณ ครั้งละไม่เกิน {PARTY_MAX} คน
        </p>
        <button
          type="button"
          onClick={onChangePhone}
          className="mt-2 cursor-pointer text-sm font-medium text-rose underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring"
        >
          ใช้รหัสอื่น
        </button>
      </header>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-1 flex-col" noValidate>
        <div className="rounded-[1.6rem] border border-border bg-card px-4 py-4 shadow-[0_18px_50px_-36px_rgba(42,38,35,0.6)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">จำนวนคนในคณะ</p>
              <p className="text-xs text-muted-foreground">ได้ตั้งแต่ {PARTY_MIN} ถึง {PARTY_MAX} คน</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-11 rounded-full bg-background"
                aria-label="ลดจำนวนคน"
                disabled={count <= PARTY_MIN}
                onClick={() => setCountTo(count - 1)}
              >
                <Minus />
              </Button>
              <p className="w-10 text-center font-display text-4xl leading-none" aria-live="polite">
                {count}
              </p>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-11 rounded-full bg-background"
                aria-label="เพิ่มจำนวนคน"
                disabled={count >= PARTY_MAX}
                onClick={() => setCountTo(count + 1)}
              >
                <Plus />
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {visible.map((person, index) => (
            <article
              key={person.id}
              id={`guest-${person.id}`}
              className="rounded-[1.6rem] border border-border bg-card p-4 shadow-[0_18px_50px_-36px_rgba(42,38,35,0.55)]"
            >
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2 className="font-serif text-xl">คนที่ {index + 1}</h2>
                <p className="text-xs text-muted-foreground">จาก {count} คน</p>
              </div>
              <Label htmlFor={`name-${person.id}`}>ชื่อ</Label>
              <Input
                id={`name-${person.id}`}
                value={person.name}
                maxLength={40}
                placeholder="ชื่อเล่นหรือชื่อจริง"
                autoComplete="name"
                aria-invalid={errors[person.id] ? true : undefined}
                aria-describedby={errors[person.id] ? `error-${person.id}` : undefined}
                className="mt-2 h-12 rounded-2xl bg-background px-4 text-base md:text-base"
                onChange={(event) => update(person.id, { name: event.target.value })}
              />
              {errors[person.id] ? (
                <p id={`error-${person.id}`} className="mt-2 text-sm text-destructive">
                  {errors[person.id]}
                </p>
              ) : null}
              <div className="mt-4 flex flex-col gap-4">
                <Choice
                  legend="เพศ"
                  name={`gender-${person.id}`}
                  value={person.gender}
                  onChange={(gender) => update(person.id, { gender })}
                  options={[
                    { value: "male", label: "ชาย" },
                    { value: "female", label: "หญิง" },
                    { value: "other", label: "อื่น ๆ" },
                  ]}
                />
                <Choice
                  legend="วัย"
                  name={`age-${person.id}`}
                  value={person.ageGroup}
                  onChange={(ageGroup) => update(person.id, { ageGroup })}
                  options={[
                    { value: "adult", label: "ผู้ใหญ่" },
                    { value: "child", label: "เด็ก" },
                  ]}
                />
                <Choice
                  legend="การร่วมงาน"
                  name={`attendance-${person.id}`}
                  value={person.attendance}
                  onChange={(attendance) => update(person.id, { attendance })}
                  options={[
                    { value: "attending", label: "มาร่วมงาน", hint: "นั่งเพว์ในโบสถ์" },
                    { value: "not_attending", label: "ไม่ได้มา", hint: "ยืนส่งความยินดีด้านนอก" },
                  ]}
                />
              </div>
            </article>
          ))}
        </div>

        <div className="sticky bottom-0 z-10 -mx-4 mt-4 border-t border-border bg-background/92 px-4 py-3 backdrop-blur-md sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0">
          {summary ? (
            <p role="alert" className="mb-2 text-sm text-destructive">
              {summary}
            </p>
          ) : (
            <p className="mb-2 text-sm text-muted-foreground" aria-live="polite">
              มาร่วมงาน {coming} คน · ส่งความยินดี {visible.length - coming} คน
            </p>
          )}
          <Button type="submit" className="h-12 w-full rounded-full text-base">
            บันทึกและเข้างาน
          </Button>
        </div>
      </form>
      </div>
    </div>
  )
}
