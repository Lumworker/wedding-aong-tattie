"use client"

import Link from "next/link"
import { useRef, useState, type MouseEvent } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { BookOpen, Flower2, Sparkles } from "lucide-react"
import { ABOUT_ROUTES, AboutHeader, WavingSprite, WISH_HREF } from "@/components/about/about-shared"
import { hand } from "@/components/about/fonts"
import { COUPLE } from "@/lib/event"
import { TATTIE_PROFILE } from "@/lib/couple-profile"
import { withQuery } from "@/lib/routes"
import { cn } from "@/lib/utils"

/** Tattie's page: a soft scrapbook. Cards stick on as you scroll; a tap scatters petals. */

const TAPE = "absolute h-4 bg-[#CCCDB0]/85"
const PETAL_COLORS = ["#E0AFA6", "#F2D9D3", "#A8665A", "#FFFCF5"]

const FALLING = [
  { left: "8%", delay: 0, duration: 11, size: 10, drift: 30 },
  { left: "22%", delay: 3, duration: 13, size: 8, drift: -24 },
  { left: "41%", delay: 6, duration: 12, size: 11, drift: 20 },
  { left: "63%", delay: 1.5, duration: 14, size: 9, drift: -30 },
  { left: "80%", delay: 4.5, duration: 12.5, size: 10, drift: 26 },
  { left: "93%", delay: 8, duration: 13, size: 8, drift: -18 },
]

type Burst = { id: number; x: number; y: number }

/** Small drawn marks per love; pebbles are hand-made since no icon set has them. */
function LoveIcon({ kind }: { kind: "yoga" | "pretty" | "books" | "stones" }) {
  const cls = "size-6 text-[#A8665A]"
  if (kind === "yoga") return <Flower2 aria-hidden="true" className={cls} strokeWidth={1.8} />
  if (kind === "pretty") return <Sparkles aria-hidden="true" className={cls} strokeWidth={1.8} />
  if (kind === "books") return <BookOpen aria-hidden="true" className={cls} strokeWidth={1.8} />
  return (
    <span aria-hidden="true" className="flex h-6 items-end gap-0.5">
      <span className="block h-3.5 w-5 rounded-[50%] bg-[#A8665A]/80" />
      <span className="block h-5 w-4 -rotate-12 rounded-[50%] bg-[#8A9DB5]" />
      <span className="block h-3 w-3.5 rounded-[50%] bg-[#CCCDB0]" />
    </span>
  )
}

function Sticker({ children, className, tilt = 0, delay = 0 }: { children: React.ReactNode; className?: string; tilt?: number; delay?: number }) {
  const reduced = useReducedMotion() === true
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, scale: 1.06, rotate: tilt * 2.2, y: 14 }}
      whileInView={{ opacity: 1, scale: 1, rotate: tilt, y: 0 }}
      style={reduced ? { rotate: tilt } : undefined}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay }}
    >
      {children}
    </motion.div>
  )
}

export function TattiePage() {
  const reduced = useReducedMotion() === true
  const p = TATTIE_PROFILE
  const rootRef = useRef<HTMLDivElement>(null)
  const [bursts, setBursts] = useState<Burst[]>([])
  const nextId = useRef(0)

  const scatter = (event: MouseEvent<HTMLDivElement>) => {
    if (reduced) return
    if ((event.target as HTMLElement).closest("a,button")) return
    const r = rootRef.current!.getBoundingClientRect()
    const id = (nextId.current += 1)
    setBursts((list) => [...list.slice(-4), { id, x: event.clientX - r.left, y: event.clientY - r.top }])
    window.setTimeout(() => setBursts((list) => list.filter((b) => b.id !== id)), 1300)
  }

  return (
    <div className={cn(hand.variable, "relative min-h-dvh overflow-hidden bg-[#F6F1E8] text-[#2E4535]")}>
      {reduced ? null : (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
          {FALLING.map((petal, index) => (
            <motion.span
              key={index}
              className="absolute -top-6 block rounded-[50%_50%_50%_0]"
              style={{ left: petal.left, width: petal.size, height: petal.size * 1.4, background: PETAL_COLORS[index % 2] }}
              animate={{ y: ["0vh", "110vh"], x: [0, petal.drift, 0], rotate: [0, 160, 320] }}
              transition={{ duration: petal.duration, delay: petal.delay, repeat: Infinity, ease: "linear" }}
            />
          ))}
        </div>
      )}

      <div ref={rootRef} onClick={scatter} className="relative z-10 mx-auto max-w-md pb-[max(env(safe-area-inset-bottom),1.75rem)]">
        <AboutHeader active="tattie" tone="light" />

        <section className="relative mx-4 mt-2.5 h-[360px]">
          <motion.div
            className="absolute inset-x-[34px] top-3.5 h-[300px] bg-[#FFFCF5] px-3 pt-3 shadow-[0_2px_6px_rgba(46,69,53,.14),0_10px_24px_rgba(46,69,53,.10)]"
            initial={reduced ? false : { y: -60, rotate: 6, opacity: 0 }}
            animate={{ y: 0, rotate: -2.5, opacity: 1 }}
            transition={{ type: "spring", stiffness: 170, damping: 16, delay: 0.1 }}
          >
            <div className="relative flex h-[222px] justify-center overflow-hidden bg-[#F2D9D3]">
              <span aria-hidden="true" className="absolute top-[22px] left-1/2 size-[170px] -translate-x-1/2 rounded-full bg-[#FFF8E6]" />
              <WavingSprite role="bride" size={204} label={`${COUPLE.brideNickname} — แตะเพื่อโบกมือ`} className="relative mt-2" />
            </div>
            <p className="mt-2.5 text-center font-[family-name:var(--font-about-hand),var(--font-thai-sans),sans-serif] text-[15px] text-[#5B6B5F]">นี่แหละ {COUPLE.brideNickname}</p>
          </motion.div>
          <span aria-hidden="true" className={cn(TAPE, "top-1 left-1/2 w-[84px] -translate-x-1/2 rotate-3")} />
          <span
            aria-hidden="true"
            className="absolute top-[238px] right-1.5 flex size-16 rotate-12 items-center justify-center rounded-full border-2 border-[#A8665A] bg-[#FFFCF5]/70 text-center font-serif text-[11px] leading-tight text-[#A8665A] italic"
          >
            bride
            <br />
            20·11·27
          </span>
          <div className="absolute inset-x-0 bottom-0 text-center">
            <h1 className="font-serif text-[46px] leading-none font-medium text-[#A8665A] italic">{COUPLE.brideLatin}</h1>
            <p className="mt-1.5 text-[13px] text-[#5B6B5F]">{COUPLE.bride} · เจ้าสาว</p>
          </div>
        </section>
        <p className="mt-2 text-center text-xs text-[#5B6B5F]">แตะ{COUPLE.brideNickname}เพื่อโบกมือ · แตะที่ว่างให้กลีบดอกไม้ร่วง</p>

        <Sticker tilt={0.8} className="relative mx-5 mt-6">
          <section
            aria-labelledby="t-who"
            className="relative px-[18px] pt-[22px] pb-4 shadow-[0_1px_4px_rgba(46,69,53,.12)]"
            style={{
              backgroundColor: "#FFFCF5",
              backgroundImage: "linear-gradient(rgba(138,157,181,.22) 1px,transparent 1px)",
              backgroundSize: "100% 28px",
              backgroundPosition: "0 14px",
            }}
          >
            <span aria-hidden="true" className={cn(TAPE, "-top-1.5 -left-2 w-[60px] -rotate-[24deg]")} />
            <h2 id="t-who" className="font-[family-name:var(--font-about-hand),var(--font-thai-sans),sans-serif] text-xl font-semibold text-[#A8665A]">
              สวัสดีค่า {COUPLE.brideNickname}เอง
            </h2>
            <p className="mt-1.5 text-[15px] leading-7">
              {p.intro}
            </p>
          </section>
        </Sticker>

        <section aria-labelledby="t-love" className="mx-4 mt-8">
          <h2 id="t-love" className="font-[family-name:var(--font-about-hand),var(--font-thai-sans),sans-serif] text-[19px] font-semibold">
            เรื่องที่{COUPLE.brideNickname}รัก
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {p.loves.map((love, index) => (
              <Sticker
                key={love.key}
                tilt={[-2, 2.5, 1.5, -1.5][index % 4]}
                delay={index * 0.06}
                className={cn(
                  "relative flex min-h-[176px] flex-col gap-1.5 px-3.5 pt-4 pb-3.5 shadow-[0_1px_4px_rgba(46,69,53,.14)]",
                  ["bg-[#FFFCF5]", "bg-[#F2D9D3]", "bg-[#D9E7D6]", "bg-[#FFF8E6]"][index % 4]
                )}
              >
                <span aria-hidden="true" className={cn(TAPE, "-top-[7px] left-1/2 w-11 -translate-x-1/2")} />
                <LoveIcon kind={love.key} />
                <span className="font-[family-name:var(--font-about-hand),var(--font-thai-sans),sans-serif] text-base font-semibold text-[#A8665A]">{love.title}</span>
                <span className="text-[13px] leading-relaxed">{love.text}</span>
              </Sticker>
            ))}
          </div>
        </section>

        <Sticker tilt={-0.6} className="relative mx-5 mt-9 bg-[#FFFCF5] px-5 pt-6 pb-5 shadow-[0_1px_4px_rgba(46,69,53,.12)]">
          <span aria-hidden="true" className="absolute -top-3 left-4 font-serif text-6xl leading-none text-[#E0AFA6]">“</span>
          <p className="font-serif text-[17px] leading-8 text-[#2E4535] italic">{p.column}</p>
          <p className="mt-3 text-right font-[family-name:var(--font-about-hand),var(--font-thai-sans),sans-serif] text-sm text-[#A8665A]">— คอลัมน์เล็ก ๆ ของ{COUPLE.brideNickname}</p>
        </Sticker>
        <p className="mx-6 mt-4 text-center text-xs leading-relaxed text-[#5B6B5F]">{p.dayJob}</p>

        {p.threeWords.length ? (
          <section aria-labelledby="t-w3" className="mx-4 mt-8">
            <h2 id="t-w3" className="mb-3 font-[family-name:var(--font-about-hand),var(--font-thai-sans),sans-serif] text-[19px] font-semibold">
              {COUPLE.brideNickname}ในสามคำ <span className="font-sans text-xs font-normal text-[#5B6B5F]">· {COUPLE.groomNickname}เลือก</span>
            </h2>
            <div className="flex justify-center gap-2.5">
              {p.threeWords.map((word, index) => (
                <Sticker
                  key={word}
                  tilt={[-4, 3, -2][index % 3]}
                  className={cn("flex h-[72px] w-[100px] items-center justify-center border-[3px] border-dotted bg-[#FFFCF5] text-sm font-medium", ["border-[#E0AFA6]", "border-[#8A9DB5]", "border-[#8EA383]"][index % 3])}
                >
                  {word}
                </Sticker>
              ))}
            </div>
          </section>
        ) : null}

        {p.letter ? (
          <Sticker className="relative mx-4 mt-8 rounded border border-[#E6DCC4] bg-[#FFFCF5] px-4 pt-5 pb-4">
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1.5"
              style={{ background: "repeating-linear-gradient(90deg,#E0AFA6 0 14px,#FFFCF5 14px 20px,#8A9DB5 20px 34px,#FFFCF5 34px 40px)" }}
            />
            <h2 className="font-[family-name:var(--font-about-hand),var(--font-thai-sans),sans-serif] text-lg font-semibold">
              {COUPLE.brideNickname}แอบเล่าเรื่อง{COUPLE.groomNickname}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed">“{p.letter}”</p>
            <p className="mt-2.5 text-right font-serif text-base text-[#A8665A] italic">— {COUPLE.brideLatin}</p>
          </Sticker>
        ) : null}

        <div className="mx-4 mt-9 flex flex-col gap-3">
          <Link
            href={withQuery(ABOUT_ROUTES.aong)}
            replace
            className="flex h-[88px] items-center gap-3 overflow-hidden rounded-[20px] bg-[#1F2E25] pr-4 pl-2 text-[#FFF8E6]"
            style={{
              backgroundImage: "linear-gradient(rgba(138,157,181,.14) 1px,transparent 1px),linear-gradient(90deg,rgba(138,157,181,.14) 1px,transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sprites/groom.png?v=6" alt="" width={88} height={88} className="-mb-3.5 size-[88px]" style={{ imageRendering: "pixelated" }} draggable={false} />
            <span className="flex-1">
              <span className="block text-xs text-[#CCCDB0]">หน้าถัดไป</span>
              <span className="block text-[17px] font-semibold">ไปรู้จัก{COUPLE.groomNickname}</span>
            </span>
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
          <Link href={WISH_HREF()} className="flex h-[52px] items-center justify-center rounded-full bg-[#2E4535] text-[15px] font-medium text-[#F6F1E8] hover:bg-[#22352A]">
            เขียนจดหมายถึงบ่าวสาว
          </Link>
        </div>

        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20">
          {bursts.map((burst) =>
            Array.from({ length: 9 }, (_, i) => {
              const angle = (i / 9) * Math.PI * 2 + burst.id
              const dist = 46 + ((i * 17) % 30)
              return (
                <motion.span
                  key={`${burst.id}-${i}`}
                  className="absolute block rounded-[50%_50%_50%_0]"
                  style={{ left: burst.x - 5, top: burst.y - 7, width: 10, height: 14, background: PETAL_COLORS[i % PETAL_COLORS.length], boxShadow: "0 0 0 1px rgba(168,102,90,.15)" }}
                  initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
                  animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist + 50, opacity: 0, rotate: 200, scale: 1 }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                />
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
