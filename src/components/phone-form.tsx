"use client"

import { FormEvent, useState } from "react"
import { PetalField } from "@/components/petal-field"
import { WelcomeScene } from "@/components/welcome-scene"
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
    <div className="relative min-h-dvh overflow-x-clip bg-[linear-gradient(180deg,var(--wash)_0%,var(--blush-pale)_100%)]">
      <PetalField className="z-20" />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[1200px] flex-col items-center px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] lg:flex-row lg:items-center lg:justify-center lg:gap-8 lg:px-8 lg:py-6">
        <WelcomeScene jumpFrame={jumpFrame} />
        <form
          onSubmit={handleSubmit}
          className="relative z-30 mt-3 w-full max-w-lg shrink-0 rounded-[1.35rem] border border-border bg-card px-6 py-7 shadow-[0_18px_44px_-24px_rgba(80,48,58,0.35)] lg:mt-0 lg:w-[23rem] lg:max-w-none lg:px-7"
          noValidate
        >
          <p className="text-center text-[13px] font-medium tracking-[0.22em] text-rose">งานมงคลสมรส</p>
          <h1 className="mt-2 text-center font-display text-4xl leading-none text-ink">
            {COUPLE.groomNickname}
            <span className="px-2 font-serif text-rose italic">&</span>
            {COUPLE.brideNickname}
          </h1>
          <p className="mt-3 text-center font-serif text-lg text-ink">{COUPLE.dateThai}</p>
          <p className="mt-1 text-center text-sm leading-6 text-muted-foreground">
            {VENUE_MAP.name} · {VENUE_MAP.area}
          </p>
          <p id="phone-hint" className="mt-5 text-sm leading-6 text-muted-foreground">
            กรอกเบอร์มือถือเพื่อตอบรับ หรือเปิดคำตอบที่บันทึกไว้
          </p>
          <Label htmlFor="phone" className="mt-4 text-base font-semibold text-ink">
            ตอบรับ
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
            className="mt-2 h-12 rounded-xl border-transparent bg-wash px-4 text-base focus-visible:border-rose/40 focus-visible:ring-rose/30 md:text-base"
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
            className="mt-4 h-12 w-full rounded-xl bg-blush text-base text-ink shadow-none hover:bg-rose hover:text-cream focus-visible:border-rose/40 focus-visible:ring-rose/40"
          >
            {pending ? "กำลังเปิด…" : "ต่อไป"}
          </Button>
        </form>
      </div>
    </div>
  )
}
