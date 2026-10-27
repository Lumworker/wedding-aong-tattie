import type { AgeGroup, Attendance, Gender, Guest } from "@/lib/types"

/** Demo congregation so the nave is full before any real parties join. */
export const SEED_PARTY_PHONE = "seed"

const MALE = [
  "กานต์",
  "อาร์ม",
  "ธนา",
  "โอ๊ต",
  "ตูน",
  "เจ",
  "บิ๊ก",
  "เต้",
  "บูม",
  "โจ้",
  "ต้น",
  "ปอ",
  "มิก",
  "ตั้ม",
  "ต้า",
  "บอย",
  "ชาญ",
  "นิว",
  "ปิง",
  "กันต์",
  "โอ้",
  "ฟลุค",
  "แบงค์",
  "ภู",
  "เติร์ด",
  "ไนซ์",
  "จูน",
  "แม็ก",
  "ติว",
  "เบน",
  "วิน",
  "ก้อง",
  "พีท",
  "มิกซ์",
  "ตั๋น",
  "เอก",
  "เบส",
  "นนท์",
  "กัปตัน",
  "ไตเติ้ล",
  "ภูมิ",
  "ชิน",
  "ตี๋",
  "บอส",
  "กอล์ฟ",
  "พีช",
  "นัท",
  "ตี๋เล็ก",
  "อิฐ",
  "เคน",
  "บีม",
  "ต่อ",
]

const FEMALE = [
  "มินตรา",
  "พลอย",
  "นภา",
  "ริสา",
  "วิภา",
  "ฝน",
  "มิ้นต์",
  "แนน",
  "ฟ้า",
  "แก้ม",
  "แพร",
  "น้ำ",
  "อุ้ม",
  "เบลล์",
  "เจน",
  "เฟิร์น",
  "เกรซ",
  "ปราง",
  "หมิว",
  "แพท",
  "แอน",
  "ไอซ์",
  "โบว์",
  "ฟิล์ม",
  "มายด์",
  "ข้าว",
  "ปุย",
  "แตง",
  "หยก",
  "ทราย",
  "น้ำตาล",
  "จ๋า",
  "กุ้ง",
  "ไข่มุก",
  "เชอรี่",
  "มุก",
  "ไข่หวาน",
  "ใบเฟิร์น",
  "สายฝน",
  "ขวัญ",
  "ดาว",
  "มะลิ",
  "แก้ว",
  "แพรว",
  "พิมพ์",
  "นุ่น",
  "เมย์",
  "อร",
  "จิ๋ว",
  "หนูนา",
  "กิ๊ฟ",
  "มิว",
  "ส้ม",
  "ต่าย",
]

function person(
  id: string,
  name: string,
  gender: Gender,
  ageGroup: AgeGroup,
  attendance: Attendance
): Guest {
  return { id, name, gender, ageGroup, attendance, partyPhone: SEED_PARTY_PHONE }
}

function buildSeedGuests(): Guest[] {
  const guests: Guest[] = []
  const attendingTarget = 108
  let attending = 0
  let index = 0

  while (attending < attendingTarget) {
    const female = index % 2 === 0
    const pool = female ? FEMALE : MALE
    const name = pool[Math.floor(index / 2) % pool.length]
    const child = index % 11 === 0
    guests.push(
      person(
        `seed-in-${index + 1}`,
        child ? `${name}น้อย` : name,
        female ? "female" : "male",
        child ? "child" : "adult",
        "attending"
      )
    )
    attending += 1
    index += 1
  }

  const absentNames: [string, Gender][] = [
    ["วิภา", "female"],
    ["ธนา", "male"],
    ["โอ๊ต", "male"],
    ["ฝน", "female"],
    ["ลุงชาญ", "male"],
    ["ป้าอร", "female"],
    ["น้าจอย", "female"],
    ["อาเล็ก", "male"],
    ["คุณยายสาย", "female"],
    ["คุณปู่ทอง", "male"],
    ["พี่เบียร์", "male"],
    ["พี่แหม่ม", "female"],
  ]
  absentNames.forEach(([name, gender], i) => {
    guests.push(person(`seed-out-${i + 1}`, name, gender, "adult", "not_attending"))
  })

  return guests
}

export const SEED_GUESTS: Guest[] = buildSeedGuests()
