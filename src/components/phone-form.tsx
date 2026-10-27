"use client"

import { FormEvent, useState } from "react"
import { CoupleHero } from "@/components/couple-hero"
import { EventTitle, Ornament } from "@/components/event-title"
import { ScreenShell } from "@/components/screen-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { maskPhoneInput, normalizeThaiMobile } from "@/lib/phone"

export function PhoneForm({ onContinue }: { onContinue: (phone: string) => void }) {
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const phone = normalizeThaiMobile(value)
    if (!phone) {
      setError("กรุณากรอกเบอร์มือถือไทย 10 หลัก ขึ้นต้นด้วย 06, 08 หรือ 09")
      return
    }
    onContinue(phone)
  }

  return (
    <ScreenShell className="justify-center">
      <CoupleHero className="mb-6" />
      <EventTitle variant="hero" />
      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-[1.7rem] border border-border bg-card/90 p-5 shadow-[0_24px_60px_-36px_rgba(42,38,35,0.55)] backdrop-blur-sm"
        noValidate
      >
        <Label htmlFor="phone" className="text-base text-ink">
          เบอร์มือถือ
        </Label>
        <p id="phone-hint" className="mt-1 text-sm leading-6 text-muted-foreground">
          ใช้เบอร์มือถือสำหรับการลงทะเบียนและติดต่อ
        </p>
        <Input
          id="phone"
          name="tel"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="เบอร์มือถือ"
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "phone-error phone-hint" : "phone-hint"}
          className="mt-3 h-12 rounded-2xl bg-background px-4 text-base md:text-base"
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
        <Button type="submit" className="mt-4 h-12 w-full rounded-full text-base">
          ต่อไป
        </Button>
        <Ornament className="mt-5" />
        <p className="text-center text-xs leading-5 text-muted-foreground">
          เคยตอบรับบนเครื่องนี้แล้ว จะเปิดฟอร์มคณะเดิม แล้วเข้าฉากได้
        </p>
      </form>
    </ScreenShell>
  )
}
