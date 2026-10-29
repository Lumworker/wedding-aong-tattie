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
    <ScreenShell className="justify-center py-8 sm:py-14">
      <div className="flex flex-col justify-center gap-8 sm:gap-10">
        <WelcomeScene jumpFrame={jumpFrame ?? 0} />
        <form
          onSubmit={handleSubmit}
          className="rounded-[1.75rem] border border-[#E6D5C3] bg-[#FFFCF8] px-6 py-8 shadow-[0_24px_50px_-32px_rgba(90,62,48,0.45)] sm:px-8 sm:py-9"
          noValidate
        >
          <p className="text-center text-[13px] font-medium tracking-[0.28em] text-rose">งานมงคลสมรส</p>
          <h1 className="mt-3 text-center font-display text-4xl leading-tight text-ink sm:text-5xl">
            {COUPLE.groomNickname}
            <span className="px-2 font-serif text-rose italic">&</span>
            {COUPLE.brideNickname}
          </h1>
          <p className="mt-4 text-center font-serif text-xl text-ink">{COUPLE.dateThai}</p>
          <p className="mt-2 text-center text-[15px] leading-normal text-ink">{VENUE_MAP.name}</p>
          <p className="text-center text-sm leading-6 text-muted-foreground">{VENUE_MAP.area}</p>
          <p id="phone-hint" className="mt-6 text-center text-sm leading-6 text-muted-foreground">
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
            className="mt-2 h-12 rounded-2xl bg-white px-4 text-base focus-visible:border-rose/40 focus-visible:ring-rose/30 md:text-base"
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
            className="mt-5 h-12 w-full rounded-full bg-blush text-base text-secondary-foreground shadow-none hover:bg-rose hover:text-paper focus-visible:border-rose/40 focus-visible:ring-rose/40"
          >
            {pending ? "กำลังเปิด…" : "ต่อไป"}
          </Button>
        </form>
      </div>
    </ScreenShell>
  )
}
