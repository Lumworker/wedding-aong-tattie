import type { Attendance, FamilySide, Gender, Guest, Party, Wish } from "@/lib/types"

const FIRST_NAMES = [
  "มิ้น",
  "เบลล์",
  "เก้า",
  "เฟิร์น",
  "โจ้",
  "แพร",
  "ต้น",
  "น้ำ",
  "ฝ้าย",
  "โอ๊ต",
  "พลอย",
  "กอล์ฟ",
  "หมิว",
  "บอส",
  "น้ำตาล",
  "เจมส์",
  "ฝุ่น",
  "เอม",
  "ต้า",
  "มุก",
  "พีช",
  "บีม",
  "เจน",
  "โฟล์ค",
  "แอปเปิ้ล",
  "กันต์",
  "มายด์",
  "เนย",
  "ตอง",
  "พีท",
  "สายฝน",
  "ชาร์ป",
  "ใบเตย",
  "ฟ้า",
  "วิน",
]

const WISH_TEXTS = [
  "ขอให้รักกันยืนยาวและหัวเราะด้วยกันทุกวัน",
  "สุขสมหวังนะ อ๋องกับแทตตี้",
  "งานสวยมาก ยินดีด้วยครับ",
  "ขอให้บ้านใหม่เต็มไปด้วยความอบอุ่น",
  "รักกันดี ๆ นะคะ สุขภาพแข็งแรง",
  "ยินดีกับทั้งคู่เสมอไป",
  "ขอให้ทุกก้าวข้างหน้ามีกันและกัน",
  "งานน่ารักมากเลย ยินดีด้วย!",
]

function phoneOf(index: number) {
  return `08${String(10000000 + index).slice(0, 8)}`
}

function guest(partial: Omit<Guest, "ageGroup"> & { ageGroup?: Guest["ageGroup"] }): Guest {
  return { ageGroup: "adult", ...partial }
}

/** ~50 guests across many parties for venue mockups. */
export function buildMockParties(): Party[] {
  const now = new Date().toISOString()
  const parties: Party[] = []
  let nameIndex = 0
  let total = 0
  const target = 50

  for (let p = 0; total < target; p += 1) {
    const phone = phoneOf(p + 1)
    const side: FamilySide = p % 2 === 0 ? "groom" : "bride"
    const gender: Gender = p % 3 === 0 ? "female" : p % 3 === 1 ? "male" : p % 2 === 0 ? "female" : "male"
    const attendance: Attendance = p % 7 === 0 ? "unsure" : "attending"
    const companions = Math.min(3, Math.max(0, (p % 4) - 1), target - total - 1)
    const mainName = FIRST_NAMES[nameIndex % FIRST_NAMES.length]
    nameIndex += 1

    const guests: Guest[] = [
      guest({
        id: `mock-main-${p}`,
        name: mainName,
        gender,
        attendance,
        side,
        partyPhone: phone,
      }),
    ]
    total += 1

    for (let c = 0; c < companions && total < target; c += 1) {
      guests.push(
        guest({
          id: `mock-cat-${p}-${c}`,
          name: companions === 1 ? "ผู้ติดตาม" : `ผู้ติดตาม ${c + 1}`,
          gender: "other",
          attendance,
          side,
          partyPhone: phone,
          isCompanion: true,
        })
      )
      total += 1
    }

    parties.push({ phone, updatedAt: now, guests })
  }

  return parties
}

export function buildMockWishes(parties: Party[]): Wish[] {
  const mains = parties
    .map((party) => party.guests.find((guest) => !guest.isCompanion))
    .filter((guest): guest is Guest => Boolean(guest))

  return mains.slice(0, WISH_TEXTS.length).map((guest, index) => ({
    id: `mock-wish-${index}`,
    from: guest.name,
    text: WISH_TEXTS[index],
    partyPhone: guest.partyPhone,
    createdAt: new Date(Date.now() - index * 60_000).toISOString(),
  }))
}
