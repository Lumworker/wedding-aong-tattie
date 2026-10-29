"use client"

import { FormEvent, useState } from "react"
import { WelcomeScene } from "@/components/welcome-scene"
import { ScreenShell } from "@/components/screen-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCoupleJump } from "@/components/venue/character"
import { COUPLE, VENUE_MAP } from "@/lib/event"
import { maskPhoneInput, normalizeThaiMobile } from "@/lib/phone"

export function PhoneForm({ onContinue }: { onContinue: (phone: string) => void | Promise<void> }) {
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [jumpPlayId, setJumpPlayId] = useState(0)
  const jumpFrame = useCoupleJump(jumpPlayId)

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
    <ScreenShell className="h-dvh max-h-dvh overflow-y-auto overscroll-y-contain px-4 py-0 pt-[clamp(0.75rem,2.2dvh,2.75rem)] pb-[max(clamp(0.75rem,2.2dvh,2.75rem),env(safe-area-inset-bottom))] sm:px-5">
      <div className="grid min-h-full flex-1 grid-rows-[minmax(7.5rem,1fr)_auto] gap-[clamp(0.4rem,1.5dvh,1.5rem)]">
        <WelcomeScene jumpFrame={jumpFrame ?? 0} />
        <form
          onSubmit={handleSubmit}
          className="rounded-[clamp(1.25rem,2dvh,1.75rem)] border border-border bg-card px-[clamp(1.1rem,4vw,2rem)] py-[clamp(0.85rem,2.1dvh,2.25rem)] shadow-[0_24px_50px_-32px_rgba(90,62,48,0.35)]"
          noValidate
        >
          <p className="text-center text-[clamp(0.68rem,1.45dvh,0.8125rem)] font-medium tracking-[0.22em] text-rose sm:tracking-[0.28em]">
            งานมงคลสมรส
          </p>
          <h1 className="mt-[clamp(0.2rem,0.7dvh,0.75rem)] text-center font-display text-[clamp(1.65rem,5dvh,3rem)] leading-tight text-ink">
            {COUPLE.groomNickname}
            <span className="px-[0.35em] font-serif text-[0.72em] text-rose italic">&</span>
            {COUPLE.brideNickname}
          </h1>
          <p className="mt-[clamp(0.25rem,0.9dvh,1rem)] text-center font-serif text-[clamp(1rem,2.5dvh,1.25rem)] leading-snug text-ink">
            {COUPLE.dateThai}
          </p>
          <p className="mt-[clamp(0.15rem,0.55dvh,0.5rem)] text-center text-[clamp(0.82rem,1.85dvh,0.9375rem)] leading-snug text-ink">
            {VENUE_MAP.name}
          </p>
          <p className="text-center text-[clamp(0.75rem,1.65dvh,0.875rem)] leading-snug text-muted-foreground">
            {VENUE_MAP.area}
          </p>
          <p
            id="phone-hint"
            className="mt-[clamp(0.45rem,1.4dvh,1.5rem)] text-center text-[clamp(0.75rem,1.65dvh,0.875rem)] leading-snug text-muted-foreground"
          >
            กรอกเบอร์มือถือเพื่อตอบรับ หรือเปิดคำตอบที่บันทึกไว้
          </p>
          <Label htmlFor="phone" className="mt-[clamp(0.35rem,1dvh,1rem)] text-[clamp(0.8rem,1.7dvh,0.875rem)]">
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
            className="mt-[clamp(0.2rem,0.5dvh,0.5rem)] h-[clamp(2.75rem,5.5dvh,3rem)] rounded-2xl bg-wash px-4 text-base focus-visible:border-rose/40 focus-visible:ring-rose/30 md:text-base"
            onFocus={() => setJumpPlayId((id) => id + 1)}
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
          <Button
            type="submit"
            disabled={pending}
            className="mt-[clamp(0.5rem,1.4dvh,1.25rem)] h-[clamp(2.75rem,5.5dvh,3rem)] w-full rounded-full text-base"
          >
            {pending ? "กำลังเปิด…" : "ต่อไป"}
          </Button>
        </form>
      </div>
    </ScreenShell>
  )
}
