import type { Attendance, FamilySide } from "@/lib/types"

const ATTENDANCE_LABEL: Record<Attendance, string> = {
  attending: "เข้าร่วม",
  unsure: "ยังไม่แน่ใจ",
  declined: "ไปไม่ได้",
}

export function attendanceLabel(attendance: Attendance) {
  return ATTENDANCE_LABEL[attendance]
}

export function sideLabel(side: FamilySide) {
  return side === "groom" ? "ฝั่งเจ้าบ่าว" : "ฝั่งเจ้าสาว"
}
