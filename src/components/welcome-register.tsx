"use client"

import { useState } from "react"
import { Envelope, Garden, daysUntil, shortDateThai } from "@/components/register/garden"
import { CEREMONY_DATE_ISO, COUPLE, VENUE_MAP } from "@/lib/event"

/**
 * /welcome v2.3 (board W1): logo B, garden scene with the couple (tap to wave),
 * invitation card overlapping the scene, one primary action and a link for guests who already answered.
 */
export function WelcomeRegister({ onRegister, onReturning }: { onRegister: () => void; onReturning: () => void }) {
  const [pending, setPending] = useState(false)
  const [weekday, ...rest] = shortDateThai(CEREMONY_DATE_ISO).split(" ")
  const [day, month, year] = rest
  const days = daysUntil(CEREMONY_DATE_ISO)

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#F6F1E8] pb-[max(env(safe-area-inset-bottom),1rem)] text-[#2E4535]">
      <header className="flex justify-center pt-[18px] pb-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/script-rose.webp?v=1" alt="Aong and Tattie" width={154} height={84} className="h-[84px] w-auto" draggable={false} />
      </header>

      <Garden height={380} coupleSize={150} floor={112} bubble="มาร่วมงานเรานะ!" interactive className="mx-3.5 shrink-0">
        <span className="pointer-events-none absolute bottom-[58px] left-3 rounded-full border border-[#E6DCC4] bg-[#FFFCF5]/85 px-2.5 py-0.5 text-[11px] text-[#5B6B5F]">
          แตะบ่าวสาวเพื่อทักทาย
        </span>
        <span aria-hidden="true" className="absolute right-3.5 bottom-14 flex -rotate-[4deg] gap-0.5">
          <Envelope />
          <Envelope />
        </span>
      </Garden>

      <section className="relative z-10 mx-6 -mt-10 flex flex-col items-center rounded-[18px] border border-[#E6DCC4] bg-[#FFFCF5] px-[18px] pt-[18px] pb-4 text-center">
        <p className="text-xs tracking-[0.02em] text-[#5B6B5F]">ขอเชิญร่วมงานแต่งงานของ</p>
        <h1 className="mt-0.5 text-[26px] leading-snug font-semibold">
          {COUPLE.groomNickname} <span className="font-display text-[#A8665A] italic">&amp;</span> {COUPLE.brideNickname}
        </h1>
        <p className="mt-2 flex items-center gap-2 text-sm">
          <span>{weekday}</span>
          <span className="font-display text-xl">{day}</span>
          <span>{month}</span>
          <span className="font-display text-xl">{year}</span>
        </p>
        <p className="mt-0.5 text-[13px] text-[#5B6B5F]">
          {VENUE_MAP.name} · {VENUE_MAP.area}
        </p>
        <span className="mt-2.5 rounded-full border border-[#E6DCC4] bg-[#FFF8E6] px-3 py-0.5 text-xs">
          อีก <span className="font-display">{days}</span> วัน
        </span>
      </section>

      <div className="mt-auto flex flex-col items-center gap-0.5 px-3.5 pt-4">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setPending(true)
            onRegister()
          }}
          className="h-[52px] w-full rounded-full bg-[#2E4535] text-base font-medium text-[#F6F1E8] hover:bg-[#22352A] disabled:opacity-70"
        >
          {pending ? "กำลังเปิด…" : "ตอบรับคำเชิญ"}
        </button>
        <button type="button" onClick={onReturning} className="min-h-11 text-sm underline underline-offset-[3px]">
          เคยตอบแล้ว · เข้าด้วยเบอร์เดิม
        </button>
      </div>
    </div>
  )
}
