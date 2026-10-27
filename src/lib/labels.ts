import type { Attendance, FamilySide } from "@/lib/types"

export function attendanceLabel(attendance: Attendance) {
  return attendance === "attending" ? "เข้าร่วมงาน" : "ยังไม่แน่ใจ"
}

export function sideLabel(side: FamilySide) {
  return side === "groom" ? "ฝั่งเจ้าบ่าว" : "ฝั่งเจ้าสาว"
}
