import { travelLabel } from "@/lib/labels"
import { partyMatrix } from "@/lib/sheet-schema"
import type { Party } from "@/lib/types"

function mainOf(party: Party) {
  return party.guests.find((guest) => !guest.isCompanion) ?? party.guests[0]
}

function carsWhen(parties: Party[], attendance: "attending" | "unsure") {
  return parties
    .filter((party) => mainOf(party)?.attendance === attendance)
    .reduce((sum, party) => sum + (party.travel?.needsParking ? party.travel.cars.length : 0), 0)
}

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
    children: guests.filter((guest) => guest.ageGroup === "child").length,
    carsAttending: carsWhen(parties, "attending"),
    carsUnsure: carsWhen(parties, "unsure"),
  }
}

export function partiesToCsv(parties: Party[]) {
  const sorted = [...parties].sort((a, b) => a.phone.localeCompare(b.phone))
  const [header, ...rows] = partyMatrix(sorted)
  const labeled = [
    ...(header ?? []).map((key) => (key === "name" ? "ชื่อที่บ่าวสาวรู้จัก" : key)),
    "เด็ก",
    "การเดินทาง",
    "ที่จอดรถ",
    "ทะเบียนรถ",
  ]
  const extended = rows.map((row, index) => {
    const party = sorted[index]
    const travel = party.travel
    return [
      ...row,
      String(party.guests.filter((guest) => guest.ageGroup === "child").length),
      travel?.mode ? travelLabel(travel.mode) : "",
      travel?.mode === "drive" ? (travel.needsParking ? `ต้องการ ${travel.cars.length} คัน` : "ไม่ต้องการ") : "",
      (travel?.cars ?? []).map((car) => `${car.plate} ${car.province}`).join(" | "),
    ]
  })
  const lines = [labeled, ...extended].map((row) => row.map(csvCell).join(","))
  return `\uFEFF${lines.join("\n")}\n`
}

function csvCell(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`
  return value
}
