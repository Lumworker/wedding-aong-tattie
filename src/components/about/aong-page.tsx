"use client"

import Link from "next/link"
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { ABOUT_ROUTES, AboutHeader, ARROW_INNER, ARROW_OUTER, PixelArrow, WavingSprite, WISH_HREF } from "@/components/about/about-shared"
import { mono } from "@/components/about/fonts"
import { COUPLE } from "@/lib/event"
import { AONG_PROFILE } from "@/lib/couple-profile"
import { withQuery } from "@/lib/routes"
import { cn } from "@/lib/utils"

/**
 * Aong's page builds itself: a swarm of pixel cursors flies to each section as it
 * scrolls into view, draws a dashed frame, then the content fades in. Afterwards the
 * page behaves like a design canvas: hover shows a frame, press-and-drag draws a
 * marquee and selects what it touches. Written from scratch (idea only, no code
 * from github.com/DhvanilPatel/swarm-cursors, which has no licence).
 */

const HERO_MS = 1700
const SECTION_MS = 850
const LONG_PRESS_MS = 450

const SWARM = [
  { label: "อ๋อง", color: "#8A9DB5" },
  { label: "แทตตี้", color: "#E0AFA6" },
  { label: "คุณ", color: "#CCCDB0" },
  { label: "แม่อ๋อง", color: "#FFF8E6" },
  { label: "เพื่อนเจ้าบ่าว", color: "#8EA383" },
  { label: "", color: "#8A9DB5" },
  { label: "", color: "#E0AFA6" },
  { label: "", color: "#CCCDB0" },
  { label: "", color: "#8EA383" },
  { label: "", color: "#FFF8E6" },
] as const

const PAGE_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='14' height='20' viewBox='0 0 7 10' shape-rendering='crispEdges'><path d='${ARROW_OUTER}' fill='#FFF8E6'/><path d='${ARROW_INNER}' fill='#CCCDB0'/></svg>`
)}") 1 1, default`

type Box = { id: string; label: string; x: number; y: number; w: number; h: number }
type Rect = { x: number; y: number; w: number; h: number }

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const overlaps = (a: Rect, b: Rect) => a.x <= b.x + b.w && a.x + a.w >= b.x && a.y <= b.y + b.h && a.y + a.h >= b.y

function reducedMotion() {
  return typeof window !== "undefined" && (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false)
}

/* ---------------------------------------------------------------- build engine */

function useSwarmBuild(order: string[]) {
  const rootRef = useRef<HTMLDivElement>(null)
  const cursorRefs = useRef<(HTMLDivElement | null)[]>([])
  const starts = useRef(new Map<string, number | null>())
  const inView = useRef(new Set<string>())
  const pos = useRef(SWARM.map(() => ({ x: -60, y: -60 })))
  const raf = useRef<number | null>(null)
  const last = useRef(0)
  const [building, setBuilding] = useState(false)
  const [done, setDone] = useState(true)
  const flags = useRef({ building: false, done: true })

  const sectionEl = (id: string) => rootRef.current?.querySelector<HTMLElement>(`[data-build="${id}"]`) ?? null

  const paint = useCallback(
    (now: number) => {
      let active = 0
      let allDone = true
      const activeEls: HTMLElement[] = []
      const list = order.filter((id) => sectionEl(id))
      // Scrolled past something before it built? Count it as built so the chain below can continue.
      const lastSeen = list.reduce((acc, id, index) => (inView.current.has(id) && starts.current.get(id) === null ? index : acc), -1)
      list.forEach((id, index) => {
        if (index < lastSeen && starts.current.get(id) === null && !inView.current.has(id)) starts.current.set(id, -Infinity)
      })
      list.forEach((id, index) => {
        const el = sectionEl(id)
        if (!el) return
        let start = starts.current.get(id) ?? null
        const prev = index > 0 ? (starts.current.get(list[index - 1]) ?? null) : -Infinity
        if (start === null && prev !== null && inView.current.has(id)) {
          start = Math.max(now, (prev === -Infinity ? now : prev) + 260)
          starts.current.set(id, start)
        }
        const ms = id === "hero" ? HERO_MS : SECTION_MS
        const p = start === null ? 0 : start === -Infinity ? 1 : clamp01((now - start) / ms)
        if (p < 1) allDone = false
        const building = start !== null && now >= start && p < 1
        if (building) {
          active += 1
          activeEls.push(el)
        }
        const content = el.querySelector<HTMLElement>("[data-content]")
        const outline = el.querySelector<HTMLElement>("[data-outline]")
        const fade = ease(clamp01((p - (id === "hero" ? 0.05 : 0.35)) / (id === "hero" ? 0.25 : 0.65)))
        if (content) {
          content.style.opacity = String(fade)
          content.style.transform = fade >= 1 ? "" : `translateY(${(1 - fade) * 10}px)`
        }
        if (outline) outline.style.opacity = start !== null && now >= start && p < 1 ? "1" : "0"
        if (id === "hero") {
          const sprite = el.querySelector<HTMLElement>("[data-sprite]")
          const name = el.querySelector<HTMLElement>("[data-name]")
          const caret = el.querySelector<HTMLElement>("[data-caret]")
          const sub = el.querySelector<HTMLElement>("[data-sub]")
          const sp = ease(clamp01((p - 0.15) / 0.45))
          if (sprite) sprite.style.clipPath = sp >= 1 ? "" : `inset(0 0 ${(1 - sp) * 100}% 0)`
          const word = COUPLE.groomLatin
          if (name) name.textContent = word.slice(0, Math.round(clamp01((p - 0.5) / 0.3) * word.length))
          if (caret) caret.style.opacity = p > 0.45 && p < 1 ? "1" : "0"
          if (sub) sub.style.opacity = String(clamp01((p - 0.8) / 0.2))
        }
      })

      // Cursors: chase a wandering point inside whatever is being built, else fly home.
      const dt = Math.min(64, now - (last.current || now))
      last.current = now
      const k = 1 - Math.exp(-dt / 120)
      const vw = window.innerWidth
      const vh = window.innerHeight
      let moving = false
      SWARM.forEach((_, i) => {
        const el = cursorRefs.current[i]
        if (!el) return
        const cur = pos.current[i]
        let tx: number
        let ty: number
        if (activeEls.length) {
          const r = activeEls[i % activeEls.length].getBoundingClientRect()
          const fx = 0.18 + ((i * 0.37) % 0.64) + 0.12 * Math.sin(now / 380 + i * 1.7)
          const fy = 0.2 + ((i * 0.53) % 0.6) + 0.1 * Math.cos(now / 450 + i)
          tx = r.left + r.width * Math.min(0.92, fx)
          ty = r.top + r.height * Math.min(0.9, fy)
        } else {
          tx = i % 2 ? vw + 40 : -60
          ty = ((i * 137) % Math.max(1, vh - 40)) + 20
        }
        cur.x += (tx - cur.x) * k
        cur.y += (ty - cur.y) * k
        if (Math.abs(tx - cur.x) + Math.abs(ty - cur.y) > 1.5) moving = true
        el.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0)`
        el.style.opacity = activeEls.length || moving ? "1" : "0"
      })

      const nextBuilding = active > 0 || moving
      if (nextBuilding !== flags.current.building) {
        flags.current.building = nextBuilding
        setBuilding(nextBuilding)
      }
      if (allDone !== flags.current.done) {
        flags.current.done = allDone
        setDone(allDone)
      }
      return active > 0 || moving || list.some((id) => starts.current.get(id) === null && inView.current.has(id))
    },
    // order is a stable literal from the page
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const kick = useCallback(() => {
    if (raf.current !== null) return
    last.current = 0
    const loop = (now: number) => {
      const keep = paint(now)
      raf.current = keep ? window.requestAnimationFrame(loop) : null
    }
    raf.current = window.requestAnimationFrame(loop)
  }, [paint])

  const resetPositions = () => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    pos.current = SWARM.map((_, i) => ({ x: i % 2 ? vw + 40 : -60, y: ((i * 211) % Math.max(1, vh)) }))
  }

  const play = useCallback(() => {
    order.forEach((id) => starts.current.set(id, null))
    resetPositions()
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
    flags.current.done = false
    setDone(false)
    kick()
  }, [kick, order])

  const finish = useCallback(() => {
    order.forEach((id) => starts.current.set(id, -Infinity))
    kick()
  }, [kick, order])

  // Decide before first paint whether to build, so content never flashes in and out.
  const decided = useRef(false)
  useLayoutEffect(() => {
    // Strict Mode runs this twice; the second pass must not read the flag the first just wrote.
    if (decided.current) return
    decided.current = true
    // Every visit builds itself; reduced motion starts finished (the Play button still replays it).
    if (reducedMotion()) {
      order.forEach((id) => starts.current.set(id, -Infinity))
      paint(performance.now())
    } else {
      order.forEach((id) => starts.current.set(id, null))
      resetPositions()
      paint(performance.now()) // flips `done` off through the same flag path as the loop
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = (entry.target as HTMLElement).dataset.build
          if (!id) return
          if (entry.isIntersecting) inView.current.add(id)
          else inView.current.delete(id)
        })
        kick()
      },
      { threshold: 0.2 }
    )
    root.querySelectorAll("[data-build]").forEach((el) => io.observe(el))
    return () => {
      io.disconnect()
      if (raf.current !== null) window.cancelAnimationFrame(raf.current)
      raf.current = null
    }
  }, [kick])

  return { rootRef, cursorRefs, building, done, play, finish }
}

/* ------------------------------------------------------------ marquee select */

function useMarquee(rootRef: React.RefObject<HTMLDivElement | null>, enabled: boolean) {
  const [hover, setHover] = useState<Box | null>(null)
  const [selected, setSelected] = useState<Box[]>([])
  const [live, setLive] = useState<Box[] | null>(null)
  const [marquee, setMarquee] = useState<Rect | null>(null)
  const [chip, setChip] = useState<{ x: number; y: number } | null>(null)
  const gesture = useRef<{
    id: number
    type: string
    x: number
    y: number
    armed: boolean
    dragging: boolean
    timer?: number
    boxes: Box[]
  } | null>(null)
  const suppressClick = useRef(false)

  const local = useCallback(
    (clientX: number, clientY: number) => {
      const r = rootRef.current!.getBoundingClientRect()
      return { x: clientX - r.left, y: clientY - r.top }
    },
    [rootRef]
  )

  const boxOf = useCallback(
    (el: HTMLElement): Box => {
      const root = rootRef.current!.getBoundingClientRect()
      const r = el.getBoundingClientRect()
      return { id: el.dataset.pickId ?? el.dataset.pick ?? "", label: el.dataset.pick ?? "", x: r.left - root.left, y: r.top - root.top, w: r.width, h: r.height }
    },
    [rootRef]
  )

  const allBoxes = useCallback(
    () => Array.from(rootRef.current?.querySelectorAll<HTMLElement>("[data-pick]") ?? []).map(boxOf),
    [rootRef, boxOf]
  )

  const clear = useCallback(() => {
    setSelected([])
    setChip(null)
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    // Once a long-press arms the marquee, the finger draws instead of scrolling.
    const onTouchMove = (event: TouchEvent) => {
      if (gesture.current?.armed) event.preventDefault()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") clear()
    }
    const onResize = () => {
      setHover(null)
      clear()
    }
    root.addEventListener("touchmove", onTouchMove, { passive: false })
    window.addEventListener("keydown", onKey)
    window.addEventListener("resize", onResize)
    return () => {
      root.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("resize", onResize)
    }
  }, [rootRef, clear])


  const arm = () => {
    const g = gesture.current
    if (!g) return
    g.armed = true
    g.boxes = allBoxes()
    document.body.style.userSelect = "none"
    if (g.type !== "mouse") navigator.vibrate?.(8)
  }

  const end = () => {
    const g = gesture.current
    if (g?.timer) window.clearTimeout(g.timer)
    gesture.current = null
    document.body.style.userSelect = ""
    setMarquee(null)
    setLive(null)
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!enabled || !event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return
    const p = local(event.clientX, event.clientY)
    gesture.current = { id: event.pointerId, type: event.pointerType, x: p.x, y: p.y, armed: false, dragging: false, boxes: [] }
    if (event.pointerType === "mouse") arm()
    else gesture.current.timer = window.setTimeout(arm, LONG_PRESS_MS)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!enabled) return
    const g = gesture.current
    if (!g) {
      if (event.pointerType !== "mouse") return
      const el = (event.target as HTMLElement).closest<HTMLElement>("[data-pick]")
      const id = el?.dataset.pickId ?? el?.dataset.pick ?? null
      if ((hover?.id ?? null) !== id) setHover(el ? boxOf(el) : null)
      return
    }
    if (g.id !== event.pointerId) return
    const p = local(event.clientX, event.clientY)
    const dist = Math.abs(p.x - g.x) + Math.abs(p.y - g.y)
    if (!g.armed) {
      if (dist > 8) end() // a normal scroll or swipe
      return
    }
    if (!g.dragging && dist > 4) {
      g.dragging = true
      setHover(null)
      setChip(null)
      try {
        rootRef.current?.setPointerCapture(event.pointerId)
      } catch {
        /* capture is a nicety */
      }
    }
    if (g.dragging) {
      const rect = { x: Math.min(g.x, p.x), y: Math.min(g.y, p.y), w: Math.abs(p.x - g.x), h: Math.abs(p.y - g.y) }
      setMarquee(rect)
      setLive(g.boxes.filter((box) => overlaps(rect, box)))
    }
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (!g || g.id !== event.pointerId) return
    const p = local(event.clientX, event.clientY)
    if (g.dragging) {
      const rect = { x: Math.min(g.x, p.x), y: Math.min(g.y, p.y), w: Math.abs(p.x - g.x), h: Math.abs(p.y - g.y) }
      const hits = g.boxes.filter((box) => overlaps(rect, box))
      setSelected(hits)
      setChip(hits.length > 1 ? p : null)
      suppressClick.current = true
    } else if (g.armed) {
      const target = event.target as HTMLElement
      const interactive = target.closest("a,button")
      if (!interactive || g.type !== "mouse") {
        const el = target.closest<HTMLElement>("[data-pick]")
        setSelected(el ? [boxOf(el)] : [])
        setChip(null)
        if (interactive) suppressClick.current = true // a long-press selected it; don't also follow it
      }
    }
    end()
  }

  const onClickCapture = (event: React.MouseEvent) => {
    if (!suppressClick.current) return
    suppressClick.current = false
    event.preventDefault()
    event.stopPropagation()
  }

  const shown = live ?? selected
  const boxes: (Box & { sel: boolean })[] = shown.map((box) => ({ ...box, sel: true }))
  if (hover && !shown.some((box) => box.id === hover.id)) boxes.push({ ...hover, sel: false })

  return {
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: end, onClickCapture, onPointerLeave: () => setHover(null) },
    boxes: enabled ? boxes : [],
    marquee: enabled ? marquee : null,
    chip: enabled && chip && !marquee ? { ...chip, count: selected.length } : null,
    clear,
  }
}

/* ------------------------------------------------------------------- page */

const ORDER = ["hero", "about", "traits", "issue", "words", "letter", "next"]

function Built({ id, className, children }: { id: string; className?: string; children: React.ReactNode }) {
  return (
    <section data-build={id} className={cn("relative", className)}>
      <div data-outline aria-hidden="true" className="pointer-events-none absolute -inset-1 rounded-[20px] border-[1.5px] border-dashed border-[#8A9DB5] opacity-0 transition-opacity duration-150" />
      <div data-content>{children}</div>
    </section>
  )
}

export function AongPage() {
  const { rootRef, cursorRefs, building, play, finish } = useSwarmBuild(ORDER)
  const { handlers, boxes, marquee, chip, clear } = useMarquee(rootRef, !building)
  const replay = () => {
    clear()
    play()
  }
  const p = AONG_PROFILE

  return (
    <div
      className={cn(mono.variable, "min-h-dvh bg-[#1F2E25] text-[#FFF8E6]")}
      style={{
        backgroundImage: "linear-gradient(rgba(138,157,181,.10) 1px,transparent 1px),linear-gradient(90deg,rgba(138,157,181,.10) 1px,transparent 1px)",
        backgroundSize: "16px 16px",
      }}
    >
      <div ref={rootRef} {...handlers} className="relative mx-auto max-w-md pb-[max(env(safe-area-inset-bottom),1.75rem)]" style={{ cursor: PAGE_CURSOR }}>
        <AboutHeader
          active="aong"
          tone="dark"
          right={
            building ? (
              <button type="button" onClick={finish} className="h-11 rounded-full border border-[#8A9DB5] bg-[#1F2E25] px-3.5 text-[13px]">
                ข้าม
              </button>
            ) : (
              <button type="button" onClick={replay} aria-label="ดูหน้าประกอบตัวอีกรอบ" className="flex size-11 items-center justify-center rounded-full hover:bg-white/5">
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" />
                </svg>
              </button>
            )
          }
        />

        <div className="flex flex-col gap-6 px-4 pt-2">
          <Built id="hero">
            <div
              data-pick="<Hero />"
              className="relative h-[300px] overflow-hidden rounded-[20px] border border-[#8A9DB5]/35"
              style={{ background: "radial-gradient(circle at 50% 40%, rgba(138,157,181,.22), rgba(31,46,37,0) 60%)" }}
            >
              <span aria-hidden="true" className="absolute top-[26px] left-1/2 size-[190px] -translate-x-1/2 rounded-full border-[1.5px] border-dashed border-[#8A9DB5]/60" />
              <div data-sprite data-pick="aong.png" className="absolute top-[18px] left-1/2 -translate-x-1/2">
                <WavingSprite role="groom" size={204} label={`${COUPLE.groomNickname} — แตะเพื่อโบกมือ`} />
              </div>
              <div className="absolute inset-x-0 top-[222px] text-center">
                <h1 data-pick="h1 · Aong" className="inline-block min-h-11 font-serif text-[44px] leading-none font-semibold">
                  <span data-name>{COUPLE.groomLatin}</span>
                  <span data-caret aria-hidden="true" className="ml-0.5 inline-block h-[34px] w-0.5 bg-[#E0AFA6] align-[-3px] opacity-0" />
                </h1>
                <p data-sub className="mt-2 text-[13px] text-[#CCCDB0]">
                  {COUPLE.groom} · เจ้าบ่าว
                </p>
              </div>
              {!building ? (
                <button
                  type="button"
                  onClick={replay}
                  className="absolute top-2.5 right-2.5 flex h-9 items-center gap-1.5 rounded-full bg-[#FFF8E6] pr-3.5 pl-2.5 text-xs font-medium text-[#1F2E25]"
                >
                  <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 4.5v15l13-7.5z" />
                  </svg>
                  Play
                </button>
              ) : null}
            </div>
            <p className="mt-2 text-center text-[11px] text-[#CCCDB0]">
              <span className="pointer-coarse:hidden">ลองกดลากบนหน้า เพื่อเลือกแบบโปรแกรมดีไซน์</span>
              <span className="hidden pointer-coarse:inline">แตะค้างแล้วลาก เพื่อเลือกแบบโปรแกรมดีไซน์</span>
            </p>
          </Built>

          <Built id="about">
            <div data-pick="readme.md">
              <h2 className="mb-2.5 font-[family-name:var(--font-about-mono),ui-monospace,monospace] text-[11px] font-normal text-[#8A9DB5]">readme.md</h2>
              <p className="text-[19px] leading-relaxed font-medium">{p.intro}</p>
            </div>
          </Built>

          <Built id="traits">
            <div data-pick="features">
              <h2 className="mb-3 text-[17px] font-semibold">
                ฟีเจอร์ของ{COUPLE.groomNickname} <span className="font-[family-name:var(--font-about-mono),ui-monospace,monospace] text-[11px] font-normal text-[#8A9DB5]">aong.exe</span>
              </h2>
              <ul className="flex flex-col gap-2.5">
                {p.traits.map((trait) => (
                  <li key={trait.fn} data-pick={trait.fn} className="rounded-2xl border border-[#8A9DB5]/40 bg-white/[0.04] px-4 py-3.5">
                    <p className="flex items-baseline justify-between gap-3">
                      <b className="text-base font-semibold">{trait.title}</b>
                      <span className="font-[family-name:var(--font-about-mono),ui-monospace,monospace] text-[11px] text-[#8A9DB5]">{trait.fn}</span>
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-[#E6E2D3]">{trait.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Built>

          <Built id="issue">
            <div data-pick="known issue" className="rounded-2xl border border-dashed border-[#E0AFA6]/70 px-4 py-3.5">
              <p className="font-[family-name:var(--font-about-mono),ui-monospace,monospace] text-[11px] text-[#E0AFA6]">⚠ known issue</p>
              <p className="mt-1 text-base font-semibold">{p.knownIssue.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-[#E6E2D3]">{p.knownIssue.text}</p>
              <p className="mt-2.5 inline-flex rounded-full bg-[#E0AFA6] px-2.5 py-1 font-[family-name:var(--font-about-mono),ui-monospace,monospace] text-[11px] text-[#1F2E25]">
                {p.knownIssue.status}
              </p>
            </div>
            <p className="mt-4 text-center text-xs text-[#CCCDB0]">{p.dayJob}</p>
          </Built>

          {p.threeWords.length ? (
            <Built id="words">
              <div data-pick="3 words">
                <h2 className="mb-2.5 text-[17px] font-semibold">
                  {COUPLE.groomNickname}ในสามคำ <span className="text-xs font-normal text-[#CCCDB0]">· {COUPLE.brideNickname}เลือก</span>
                </h2>
                <div className="flex flex-wrap gap-2">
                  {p.threeWords.map((word, index) => (
                    <span key={word} className={cn("flex h-10 items-center rounded-full px-4 text-sm font-medium text-[#1F2E25]", ["bg-[#8A9DB5]", "bg-[#CCCDB0]", "bg-[#E0AFA6]"][index % 3])}>
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            </Built>
          ) : null}

          {p.letter ? (
            <Built id="letter">
              <div data-pick="<Letter />" className="rounded-[18px] bg-[#FFFCF5] p-4 text-[#2E4535]">
                <h2 className="text-base font-semibold">
                  {COUPLE.groomNickname}แอบเล่าเรื่อง{COUPLE.brideNickname}
                </h2>
                <p className="mt-2 text-[15px] leading-relaxed">“{p.letter}”</p>
                <p className="mt-1 text-right font-serif text-[15px] text-[#A8665A] italic">— {COUPLE.groomLatin}</p>
              </div>
            </Built>
          ) : null}

          <Built id="next">
            <div className="flex flex-col gap-3">
              <Link
                href={withQuery(ABOUT_ROUTES.tattie)}
                replace
                data-pick="<NextPerson />"
                className="flex h-[88px] items-center gap-3 overflow-hidden rounded-[20px] bg-[#F2D9D3] pr-4 pl-2 text-[#2E4535]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/sprites/bride.png?v=6" alt="" width={88} height={88} className="-mb-3.5 size-[88px]" style={{ imageRendering: "pixelated" }} draggable={false} />
                <span className="flex-1">
                  <span className="block text-xs text-[#5B6B5F]">หน้าถัดไป</span>
                  <span className="block text-[17px] font-semibold">ไปรู้จัก{COUPLE.brideNickname}</span>
                </span>
                <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <Link
                href={WISH_HREF()}
                data-pick="<Button />"
                className="flex h-[52px] items-center justify-center rounded-full bg-[#FFF8E6] text-[15px] font-medium text-[#2E4535] hover:bg-white"
              >
                เขียนจดหมายถึงบ่าวสาว
              </Link>
            </div>
          </Built>
        </div>

        {/* selection overlay — coordinates are relative to this column */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-30">
          {boxes.map((box) => (
            <div
              key={box.id + (box.sel ? "-s" : "-h")}
              className="absolute box-border rounded-[4px]"
              style={{
                left: box.x,
                top: box.y,
                width: box.w,
                height: box.h,
                border: box.sel ? "1.5px solid #8A9DB5" : "1px solid rgba(138,157,181,.9)",
                background: box.sel ? "rgba(138,157,181,.08)" : "transparent",
              }}
            >
              <span
                className={cn(
                  "absolute -top-[21px] -left-px h-[18px] rounded-[4px] px-1.5 font-[family-name:var(--font-about-mono),ui-monospace,monospace] text-[10px] leading-[18px] whitespace-nowrap text-[#1F2E25]",
                  box.sel ? "bg-[#8A9DB5]" : "bg-[#CCCDB0]"
                )}
              >
                {box.label}
              </span>
              {box.sel ? (
                <>
                  {["-top-1 -left-1", "-top-1 -right-1", "-bottom-1 -left-1", "-right-1 -bottom-1"].map((at) => (
                    <span key={at} className={cn("absolute size-[7px] border-[1.5px] border-[#8A9DB5] bg-[#FFF8E6]", at)} />
                  ))}
                  <span className="absolute -bottom-[22px] left-1/2 h-[18px] -translate-x-1/2 rounded-[4px] bg-[#8A9DB5] px-1.5 font-[family-name:var(--font-about-mono),ui-monospace,monospace] text-[10px] leading-[18px] whitespace-nowrap text-[#1F2E25]">
                    {Math.round(box.w)} × {Math.round(box.h)}
                  </span>
                </>
              ) : null}
            </div>
          ))}
          {marquee ? (
            <div className="absolute box-border border border-[#8A9DB5] bg-[#8A9DB5]/15" style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }} />
          ) : null}
          {chip && chip.count > 1 ? (
            <div
              className="absolute flex h-7 items-center gap-1.5 rounded-full bg-[#FFF8E6] px-2.5 text-xs whitespace-nowrap text-[#1F2E25] shadow-[0_4px_14px_rgba(0,0,0,.25)]"
              style={{ left: Math.max(8, Math.min(chip.x + 12, 300)), top: chip.y + 14 }}
            >
              เลือก {chip.count} ชิ้น
            </div>
          ) : null}
        </div>
      </div>

      {/* the swarm lives in viewport space so it can follow the page while you scroll */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
        {SWARM.map((cursor, index) => (
          <div
            key={index}
            ref={(el) => {
              cursorRefs.current[index] = el
            }}
            className="absolute top-0 left-0 flex items-start gap-0.5 opacity-0 will-change-transform"
            style={{ transform: "translate3d(-60px,-60px,0)" }}
          >
            <PixelArrow fill={cursor.color} />
            {cursor.label ? (
              <span className="mt-3.5 rounded px-1.5 text-[10px] leading-4 whitespace-nowrap text-[#1F2E25]" style={{ background: cursor.color }}>
                {cursor.label}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
