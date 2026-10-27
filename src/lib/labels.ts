import type { AgeGroup, Attendance } from "@/lib/types"

export function ageLabel(ageGroup: AgeGroup) {
  return ageGroup === "child" ? "เด็ก" : "ผู้ใหญ่"
}

export function attendanceLabel(attendance: Attendance) {
  return attendance === "attending" ? "มาร่วมงาน" : "ส่งความยินดี"
}
