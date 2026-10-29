"use client"

import { FormEvent, useState } from "react"
import { FormStepper } from "@/components/form-stepper"
import { ScreenShell } from "@/components/screen-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { COUPLE, VENUE_MAP } from "@/lib/event"
import { maskPhoneInput, normalizeThaiMobile } from "@/lib/phone"

export function PhoneForm({ onContinue }: { onContinue: (phone: string) => void | Promise<void> }) {
  const [value, setValue] = useState("")
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
    try {
      await onContinue(phone)
    } finally {
      setPending(false)
    }
  }

  return (
    <ScreenShell className="py-8">
      <div className="my-auto">
        <FormStepper current={1} />
        <header className="mt-8 text-center">
          <p className="text-[13px] font-medium tracking-[0.22em] text-rose uppercase">งานมงคลสมรส</p>
          <h1 className="mt-2 font-display text-4xl leading-tight text-ink">
            {COUPLE.groomNickname}
            <span className="px-2 text-rose">&</span>
            {COUPLE.brideNickname}
          </h1>
          <p className="mt-3 font-serif text-lg text-ink">{COUPLE.dateThai}</p>
          <p className="mt-1 text-[15px] leading-normal text-ink">{VENUE_MAP.name}</p>
          <p className="text-sm leading-6 text-muted-foreground">
            {VENUE_MAP.area} · {VENUE_MAP.nameEn}
          </p>
        </header>
        <p className="mt-6 text-center text-sm leading-6 text-muted-foreground">
          กรอกเบอร์มือถือเพื่อตอบรับ หรือเปิดคำตอบที่บันทึกไว้
        </p>
        <form onSubmit={handleSubmit} className="mt-4" noValidate>
          <Label htmlFor="phone">เบอร์มือถือ</Label>
          <Input
            id="phone"
            name="tel"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="08X-XXX-XXXX"
            value={value}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "phone-error" : undefined}
            className="mt-2 h-12 rounded-2xl bg-card px-4 text-base md:text-base"
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
        </form>
      </div>
    </ScreenShell>
  )
}
