"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Guest, Wish } from "@/lib/types"
import { cn } from "@/lib/utils"

const MAX = 72

export function WishComposer({
  party,
  phone,
  wishes,
  onSend,
  onUpdate,
}: {
  party: Guest[]
  phone: string
  wishes: Wish[]
  onSend: (from: string, text: string) => void
  onUpdate: (wish: Wish) => void
}) {
  const names = useMemo(
    () => party.filter((guest) => !guest.isCompanion).map((guest) => guest.name).filter(Boolean),
    [party]
  )
  const mine = useMemo(
    () => wishes.filter((wish) => wish.partyPhone === phone).slice().reverse(),
    [wishes, phone]
  )

  const [editingId, setEditingId] = useState<string | null>(null)
  const [from, setFrom] = useState(names[0] ?? "")
  const [text, setText] = useState("")
  const [status, setStatus] = useState<"idle" | "sent" | "saved">("idle")
  const remaining = MAX - text.length
  const ready = from.trim().length > 0 && text.trim().length > 0
  const editing = editingId !== null

  useEffect(() => {
    if (!editing && names.length === 1 && !from) setFrom(names[0])
  }, [editing, names, from])

  function resetComposer(nextFrom = names[0] ?? "") {
    setEditingId(null)
    setFrom(nextFrom)
    setText("")
  }

  function startEdit(wish: Wish) {
    setEditingId(wish.id)
    setFrom(names.includes(wish.from) || names.length === 0 ? wish.from : names[0])
    setText(wish.text)
    setStatus("idle")
    window.requestAnimationFrame(() => document.getElementById("wish-text")?.focus())
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!ready) return

    if (editingId) {
      const original = wishes.find((wish) => wish.id === editingId)
      if (!original) return
      onUpdate({
        ...original,
        from: from.trim(),
        text: text.trim(),
      })
      resetComposer()
      setStatus("saved")
      return
    }

    onSend(from.trim(), text.trim())
    resetComposer(from.trim())
    setStatus("sent")
  }

  return (
    <div className="rounded-[1.4rem] border border-border bg-card p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-xl">{editing ? "✏️ แก้ไขคำอวยพร" : "💌 คำอวยพร"}</h2>
          {names.length === 1 && !editing ? (
            <p className="truncate text-xs text-muted-foreground">จาก {from || names[0]}</p>
          ) : null}
        </div>

        {names.length > 1 ? (
          <div className="mt-3">
            <Label htmlFor="wish-from">ลงชื่อ</Label>
            <select
              id="wish-from"
              value={names.includes(from) ? from : names[0]}
              onChange={(event) => setFrom(event.target.value)}
              className="mt-1 h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm"
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
            <Label htmlFor="wish-from">ลงชื่อ</Label>
            <Input
              id="wish-from"
              value={from}
              maxLength={24}
              placeholder="ชื่อที่จะโชว์บนคำอวยพร"
              className="mt-1 h-11 rounded-2xl px-3"
              onChange={(event) => setFrom(event.target.value)}
            />
          </div>
        ) : null}

        <Label htmlFor="wish-text" className="mt-3 block">
          ข้อความ
        </Label>
        <textarea
          id="wish-text"
          value={text}
          maxLength={MAX}
          rows={3}
          placeholder="สุขสมหวังด้วยกันนะ"
          className="mt-1 w-full resize-none rounded-2xl border border-input bg-background px-3 py-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          onChange={(event) => {
            setText(event.target.value)
            if (status !== "idle") setStatus("idle")
          }}
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className={cn("text-xs text-muted-foreground", remaining < 12 && "text-rose")}>{remaining}</p>
          <div className="flex gap-2">
            {editing ? (
              <Button
                type="button"
                variant="ghost"
                className="h-10 rounded-full px-4"
                onClick={() => {
                  resetComposer()
                  setStatus("idle")
                }}
              >
                ยกเลิก
              </Button>
            ) : null}
            <Button type="submit" disabled={!ready} className="h-10 rounded-full px-5">
              {editing ? "บันทึก" : "ส่ง"}
            </Button>
          </div>
        </div>
        {status === "sent" ? (
          <p className="mt-2 text-sm text-sage-deep" role="status">
            ส่งแล้ว — ดูข้อความลอยบนฉากได้เลย
          </p>
        ) : null}
        {status === "saved" ? (
          <p className="mt-2 text-sm text-sage-deep" role="status">
            บันทึกการแก้ไขแล้ว
          </p>
        ) : null}
      </form>

      {mine.length > 0 ? (
        <section className="mt-4 border-t border-border pt-3">
          <h3 className="text-sm font-medium">ประวัติการอวยพร</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">แตะรายการเพื่อแก้ไข</p>
          <ul className="mt-2 flex flex-col gap-2">
            {mine.map((wish) => {
              const active = wish.id === editingId
              return (
                <li key={wish.id}>
                  <button
                    type="button"
                    onClick={() => startEdit(wish)}
                    className={cn(
                      "w-full rounded-2xl border px-3 py-2.5 text-left transition-colors",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                      active
                        ? "border-primary bg-primary/8"
                        : "border-border bg-background hover:bg-muted"
                    )}
                  >
                    <p className="truncate text-sm font-medium text-ink">{wish.from}</p>
                    <p className="mt-0.5 line-clamp-2 text-sm leading-5 text-muted-foreground">{wish.text}</p>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
