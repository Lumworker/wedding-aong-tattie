"use client"

import { FormEvent, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Guest } from "@/lib/types"
import { cn } from "@/lib/utils"

const MAX = 72

export function WishComposer({
  party,
  onSend,
}: {
  party: Guest[]
  onSend: (from: string, text: string) => void
}) {
  const names = useMemo(() => party.map((guest) => guest.name).filter(Boolean), [party])
  const [from, setFrom] = useState(names[0] ?? "")
  const [text, setText] = useState("")
  const [sent, setSent] = useState(false)
  const remaining = MAX - text.length
  const ready = from.trim().length > 0 && text.trim().length > 0

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!ready) return
    onSend(from.trim(), text.trim())
    setText("")
    setSent(true)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 rounded-[1.4rem] border border-border bg-card p-4">
      <h2 className="font-serif text-xl">คำอวยพร</h2>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        เขียนสั้น ๆ แล้วเปิดการลอยบนฉากได้จากปุ่มมุมล่างโบสถ์
      </p>
      {names.length > 1 ? (
        <div className="mt-3">
          <Label htmlFor="wish-from">ลงชื่อ</Label>
          <select
            id="wish-from"
            value={from}
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
      ) : names.length === 1 ? (
        <p className="mt-3 text-sm text-muted-foreground">ลงชื่อเป็น {from}</p>
      ) : (
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
      )}
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
          if (sent) setSent(false)
        }}
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className={cn("text-xs text-muted-foreground", remaining < 12 && "text-rose")}>{remaining} ตัวอักษร</p>
        <Button type="submit" disabled={!ready} className="h-10 rounded-full px-4">
          ส่งคำอวยพร
        </Button>
      </div>
      {sent ? (
        <p className="mt-2 text-sm text-sage-deep" role="status">
          ส่งแล้ว — เปิดการลอยบนฉากเพื่อดูข้อความลอยขึ้น
        </p>
      ) : null}
    </form>
  )
}
