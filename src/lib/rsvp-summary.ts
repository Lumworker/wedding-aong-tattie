import { partyMatrix } from "@/lib/sheet-schema"
import type { Party } from "@/lib/types"

export function summarizeParties(parties: Party[]) {
  const guests = parties.flatMap((party) => party.guests)
  const attending = guests.filter((guest) => guest.attendance === "attending")
  const companions = guests.filter((guest) => guest.isCompanion)
  return {
    parties: parties.length,
    guests: guests.length,
    attending: attending.length,
    unsure: guests.filter((guest) => guest.attendance === "unsure").length,
    declined: guests.filter((guest) => guest.attendance === "declined").length,
    withCompanions: parties.filter((party) => party.guests.some((guest) => guest.isCompanion)).length,
    companions: companions.length,
  }
}

export function partiesToCsv(parties: Party[]) {
  const sorted = [...parties].sort((a, b) => a.phone.localeCompare(b.phone))
  const [header, ...rows] = partyMatrix(sorted)
  const labeled = (header ?? []).map((key) => (key === "name" ? "ชื่อที่บ่าวสาวรู้จัก" : key))
  const lines = [labeled, ...rows].map((row) => row.map(csvCell).join(","))
  return `\uFEFF${lines.join("\n")}\n`
}

function csvCell(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`
  return value
}
