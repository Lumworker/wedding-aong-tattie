"use client"

import { FormEvent, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Ornament } from "@/components/event-title"
import { maskPhoneInput, normalizeThaiMobile } from "@/lib/phone"

export function PhoneForm({
  onContinue,
  onClose,
}: {
  onContinue: (phone: string) => void
  onClose?: () => void
}) {
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const phone = normalizeThaiMobile(value)
    if (!phone) {
      setError("กรุณากรอกเบอร์มือถือไทย 10 หลัก ขึ้นต้นด้วย 06, 08 หรือ 09")
      return
    }
    setError(null)
    onContinue(phone)
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-5 py-10">
      {onClose ? (
        <div className="mb-4 flex justify-end">
          <Button type="button" variant="ghost" className="h-9 rounded-full px-3" onClick={onClose}>
            ปิด
          </Button>
        </div>
      ) : null}
      <p className="text-[11px] font-medium tracking-[0.28em] text-rose uppercase">ลงทะเบียน</p>
      <h1 className="mt-2 font-display text-4xl leading-none text-ink sm:text-5xl">เบอร์มือถือ</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        ใช้เบอร์เป็นรหัสของคณะแขก ครั้งหน้าเครื่องนี้จะจำการตอบรับไว้ให้
      </p>
      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-[1.7rem] border border-border bg-card/90 p-5 shadow-[0_24px_60px_-36px_rgba(42,38,35,0.55)] backdrop-blur-sm"
        noValidate
      >
        <Label htmlFor="phone" className="text-base text-ink">
          เบอร์มือถือ
        </Label>
        <p id="phone-hint" className="mt-1 text-sm leading-6 text-muted-foreground">
          กรอกเมื่อพร้อมลงทะเบียน ไม่ต้องใส่ตั้งแต่เปิดหน้าเว็บ
        </p>
        <Input
          id="phone"
          name="tel"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="081-234-5678"
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
          ตัวอย่างเบอร์ 0812345678 หรือ +66812345678
        </p>
      </form>
    </div>
  )
}
