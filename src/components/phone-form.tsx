"use client"

import { FormEvent, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Character } from "@/components/venue/character"
import { EventTitle, Ornament } from "@/components/event-title"
import { PetalField } from "@/components/petal-field"
import { maskInviteInput, normalizeThaiMobile } from "@/lib/phone"

export function PhoneForm({ onContinue }: { onContinue: (phone: string) => void }) {
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const code = normalizeThaiMobile(value)
    if (!code) {
      setError(value.trim() ? "รหัสนี้เข้างานไม่ได้" : "กรุณากรอกรหัสเข้างาน")
      return
    }
    setError(null)
    onContinue(code)
  }

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-5 py-10">
      <PetalField />
      <div className="relative z-10">
        <div className="mb-6 flex justify-center" aria-hidden="true">
          <svg viewBox="0 0 220 150" className="h-36 w-56 overflow-visible">
            <ellipse cx="110" cy="138" rx="70" ry="8" fill="#2A2623" opacity="0.06" />
            <g transform="translate(78 142) scale(0.92)">
              <Character role="groom" mood="idle" showName={false} />
            </g>
            <g transform="translate(142 142) scale(0.92)">
              <Character role="bride" mood="idle" showName={false} />
            </g>
            <text x="110" y="58" textAnchor="middle" fill="#C48984" fontSize="16" className="wd-heart">
              ♥
            </text>
          </svg>
        </div>

        <EventTitle variant="hero" />

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-[1.7rem] border border-border bg-card/90 p-5 shadow-[0_24px_60px_-36px_rgba(42,38,35,0.55)] backdrop-blur-sm"
          autoComplete="off"
          noValidate
        >
          <Label htmlFor="invite-code" className="text-base text-ink">
            รหัสเข้างาน
          </Label>
          <p id="invite-hint" className="mt-1 text-sm leading-6 text-muted-foreground">
            ใช้เบอร์มือถือสำหรับการลงทะเบียนและติดต่อ
          </p>
          <Input
            id="invite-code"
            name="invite-code"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="รหัสเข้างาน"
            value={value}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "invite-error invite-hint" : "invite-hint"}
            className="mt-3 h-12 rounded-2xl bg-background px-4 text-base tracking-[0.18em] md:text-base"
            onChange={(event) => {
              setValue(maskInviteInput(event.target.value))
              if (error) setError(null)
            }}
          />
          {error ? (
            <p id="invite-error" role="alert" className="mt-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="mt-4 h-12 w-full rounded-full text-base">
            ต่อไป
          </Button>
          <Ornament className="mt-5" />
          <p className="text-center text-xs leading-5 text-muted-foreground">
            เคยตอบรับบนเครื่องนี้แล้ว จะกลับเข้าฉากงานทันที
          </p>
        </form>
      </div>
    </div>
  )
}
