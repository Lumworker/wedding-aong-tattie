import type { Party } from "@/lib/types"

export function summarizeParties(parties: Party[]) {
  const guests = parties.flatMap((party) => party.guests)
  const attending = guests.filter((guest) => guest.attendance === "attending")
  return {
    parties: parties.length,
    guests: guests.length,
    attending: attending.length,
    unsure: guests.length - attending.length,
    adults: attending.filter((guest) => guest.ageGroup !== "child").length,
    children: attending.filter((guest) => guest.ageGroup === "child").length,
  }
}

export function partiesToCsv(parties: Party[]) {
  const header = ["phone", "name", "gender", "ageGroup", "attendance", "side", "isCompanion", "updatedAt"]
  const lines = [header.join(",")]
  const sorted = [...parties].sort((a, b) => a.phone.localeCompare(b.phone))
  for (const party of sorted) {
    for (const guest of party.guests) {
      const cells = [
        party.phone,
        guest.name,
        guest.gender,
        guest.ageGroup,
        guest.attendance,
        guest.side ?? "",
        guest.isCompanion ? "true" : "false",
        party.updatedAt,
      ]
      lines.push(cells.map(csvCell).join(","))
    }
  }
  return `\uFEFF${lines.join("\n")}\n`
}

function csvCell(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`
  return value
}
