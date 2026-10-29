"use client"

import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Guest, Wish } from "@/lib/types"
import { cn } from "@/lib/utils"
import { WISH_TEXT_MAX, clipWishText, wishGlyphCount } from "@/lib/wish"

function scrollFieldIntoView(target: EventTarget | null) {
  if (!(target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement)) return
  window.setTimeout(() => {
    target.scrollIntoView({ block: "center", behavior: "smooth" })
  }, 300)
}

export function WishComposer({
  party,
  wishes,
  editToken,
  onSend,
  onUpdate,
}: {
  party: Guest[]
  wishes: Wish[]
  /** Set when the guest taps แก้ไข on a wish they already sent. */
  editToken: { id: string; at: number } | null
  onSend: (from: string, text: string) => void | Promise<void>
  onUpdate: (wish: Wish) => void | Promise<void>
}) {
  const names = useMemo(
    () => party.filter((guest) => !guest.isCompanion).map((guest) => guest.name).filter(Boolean),
    [party]
  )

  const [editingId, setEditingId] = useState<string | null>(null)
  const [from, setFrom] = useState(names[0] ?? "")
  const [text, setText] = useState("")
  const [status, setStatus] = useState<"idle" | "sent" | "saved" | "error">("idle")
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const count = wishGlyphCount(text)
  const remaining = WISH_TEXT_MAX - count
  const ready = from.trim().length > 0 && text.trim().length > 0 && count <= WISH_TEXT_MAX
  const editing = editingId !== null
  const appliedEdit = useRef<number | null>(null)

  useEffect(() => {
    if (!editing && names.length === 1 && !from) setFrom(names[0])
  }, [editing, names, from])

  useEffect(() => {
    if (!editToken || appliedEdit.current === editToken.at) return
    const wish = wishes.find((item) => item.id === editToken.id)
    if (!wish) return
    appliedEdit.current = editToken.at
    setEditingId(wish.id)
    setFrom(names.includes(wish.from) || names.length === 0 ? wish.from : names[0])
    setText(clipWishText(wish.text))
    setStatus("idle")
    window.requestAnimationFrame(() => document.getElementById("wish-text")?.focus())
  }, [editToken, names, wishes])

  function resetComposer(nextFrom = names[0] ?? "") {
    setEditingId(null)
    setFrom(nextFrom)
    setText("")
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!ready || sending) return

    const nextFrom = from.trim()
    const nextText = clipWishText(text.trim())
    if (!nextFrom || !nextText || wishGlyphCount(nextText) > WISH_TEXT_MAX) return
    setSending(true)
    setError(null)
    setStatus("idle")
    try {
      if (editingId) {
        const original = wishes.find((wish) => wish.id === editingId)
        if (!original) return
        await onUpdate({
          ...original,
          from: nextFrom,
          text: nextText,
        })
        resetComposer()
        setStatus("saved")
        return
      }

      await onSend(nextFrom, nextText)
      resetComposer(nextFrom)
      setStatus("sent")
    } catch (caught) {
      setStatus("error")
      setError(caught instanceof Error ? caught.message : "บันทึกไม่สำเร็จ")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="rounded-[1.4rem] border border-border bg-card p-4">
      <form onSubmit={handleSubmit}>
        {editing ? <p className="mb-2 text-[15px] font-medium text-ink">กำลังแก้ไข</p> : null}
        {names.length === 1 && !editing ? (
          <p className="mb-2 text-[13px] leading-normal text-muted-foreground">จาก {from || names[0]}</p>
        ) : null}

        {names.length > 1 ? (
          <div className="mt-3">
            <Label htmlFor="wish-from" className="text-[15px]">
              ลงชื่อ
            </Label>
            <select
              id="wish-from"
              value={names.includes(from) ? from : names[0]}
              onChange={(event) => setFrom(event.target.value)}
              onFocus={(event) => scrollFieldIntoView(event.target)}
              className="mt-1 h-11 w-full rounded-2xl border border-input bg-background px-3 text-base"
            >
              {names.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        ) : names.length === 0 ? (
          <div className="mt-3">
            <Label htmlFor="wish-from" className="text-[15px]">
              ลงชื่อ
            </Label>
            <Input
              id="wish-from"
              value={from}
              maxLength={24}
              placeholder="ชื่อที่จะโชว์บนคำอวยพร"
              className="mt-1 h-11 rounded-2xl px-3 text-base"
              onChange={(event) => setFrom(event.target.value)}
              onFocus={(event) => scrollFieldIntoView(event.target)}
            />
          </div>
        ) : null}

        <Label htmlFor="wish-text" className="mt-3 block text-[15px]">
          ข้อความ
        </Label>
        <textarea
          id="wish-text"
          value={text}
          maxLength={WISH_TEXT_MAX}
          rows={4}
          placeholder="สุขสมหวังด้วยกันนะ"
          aria-describedby="wish-count"
          className="mt-1 w-full scroll-mb-40 resize-none rounded-2xl border border-input bg-background px-3 py-2.5 text-base leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          onFocus={(event) => scrollFieldIntoView(event.target)}
          onChange={(event) => {
            setText(clipWishText(event.target.value))
            if (status !== "idle") setStatus("idle")
          }}
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p
            id="wish-count"
            className={cn(
              "text-[13px] tabular-nums text-muted-foreground",
              remaining <= 20 && "font-medium text-rose"
            )}
          >
            <span className="sr-only">ความยาวข้อความ </span>
            {count}/{WISH_TEXT_MAX}
          </p>
          <div className="flex gap-2">
            {editing ? (
              <Button
                type="button"
                variant="ghost"
                className="h-11 min-h-11 rounded-full px-4 text-[15px]"
                onClick={() => {
                  resetComposer()
                  setStatus("idle")
                }}
              >
                ยกเลิก
              </Button>
            ) : null}
            <Button type="submit" disabled={!ready || sending} className="h-11 min-h-11 rounded-full px-5 text-[15px]">
              {sending ? "กำลังบันทึก…" : editing ? "บันทึก" : "ส่ง"}
            </Button>
          </div>
        </div>
        {status === "sent" ? (
          <p className="mt-2 text-[15px] text-sage-deep" role="status">
            ส่งแล้ว — ดูข้อความลอยบนฉากได้เลย
          </p>
        ) : null}
        {status === "saved" ? (
          <p className="mt-2 text-[15px] text-sage-deep" role="status">
            บันทึกการแก้ไขแล้ว
          </p>
        ) : null}
        {status === "error" && error ? (
          <p className="mt-2 text-[15px] text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  )
}
