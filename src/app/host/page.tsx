"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatThaiMobile } from "@/lib/phone"
import type { Party } from "@/lib/types"

type Summary = {
  parties: number
  guests: number
  attending: number
  unsure: number
  adults: number
  children: number
}

export default function HostPage() {
  const [secret, setSecret] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [parties, setParties] = useState<Party[] | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)

  async function load() {
    setLoading(true)
    const response = await fetch("/api/host/rsvps")
    if (response.status === 401 || response.status === 503) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      setParties(null)
      setSummary(null)
      setError(response.status === 503 ? payload?.error ?? "ยังไม่ได้ตั้งรหัส" : null)
      setLoading(false)
      return
    }
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      setError(payload?.error ?? "อ่านรายชื่อไม่สำเร็จ")
      setLoading(false)
      return
    }
    const payload = (await response.json()) as { parties: Party[]; summary: Summary }
    setParties(payload.parties)
    setSummary(payload.summary)
    setError(null)
    setLoading(false)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  async function login(event: FormEvent) {
    event.preventDefault()
    setError(null)
    const response = await fetch("/api/host/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret }),
    })
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      setError(payload?.error ?? "เข้าไม่ได้")
      return
    }
    setSecret("")
    await load()
  }

  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-4 py-10">
      <p className="text-[11px] font-medium tracking-[0.28em] text-rose uppercase">เจ้าภาพ</p>
      <h1 className="mt-2 font-display text-4xl text-ink">รายชื่อตอบรับ</h1>
      <p className="mt-2 text-sm text-muted-foreground">ดูว่าใครมา ใครยังไม่แน่ใจ และส่งออก CSV</p>

      {loading ? <p className="mt-8 text-sm text-muted-foreground">กำลังโหลด</p> : null}

      {!loading && !parties ? (
        <form onSubmit={login} className="mt-8 max-w-sm space-y-3">
          <label className="block text-sm" htmlFor="host-secret">
            รหัสเจ้าภาพ
          </label>
          <Input
            id="host-secret"
            type="password"
            autoComplete="current-password"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
          />
          {error ? <p className="text-sm text-rose">{error}</p> : null}
          <Button type="submit" className="h-10 rounded-full px-5">
            เข้าดูรายชื่อ
          </Button>
        </form>
      ) : null}

      {summary && parties ? (
        <section className="mt-8 space-y-6">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat label="คณะ" value={summary.parties} />
            <Stat label="มา" value={summary.attending} />
            <Stat label="ยังไม่แน่ใจ" value={summary.unsure} />
            <Stat label="ผู้ใหญ่ที่มา" value={summary.adults} />
            <Stat label="เด็กที่มา" value={summary.children} />
            <Stat label="ทั้งหมด" value={summary.guests} />
          </div>
          <a
            href="/api/host/export"
            className="inline-flex h-10 items-center rounded-full border border-border bg-card px-4 text-sm"
          >
            ดาวน์โหลด CSV
          </a>
          <ul className="space-y-3">
            {parties.map((party) => (
              <li key={party.phone} className="rounded-2xl border border-border bg-card px-4 py-3">
                <p className="font-medium">{formatThaiMobile(party.phone)}</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {party.guests.map((guest) => (
                    <li key={guest.id} className="flex flex-wrap gap-x-2 text-muted-foreground">
                      <span className="text-ink">{guest.name}</span>
                      <span>{guest.attendance === "attending" ? "มา" : "ยังไม่แน่ใจ"}</span>
                      <span>{guest.ageGroup === "child" ? "เด็ก" : "ผู้ใหญ่"}</span>
                      {guest.isCompanion ? <span>ผู้ติดตาม</span> : null}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-3 py-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="font-display text-3xl leading-none text-ink">{value}</p>
    </div>
  )
}
