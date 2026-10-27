import type { AgeGroup, Attendance, Gender } from "@/lib/types"

export function genderLabel(gender: Gender): string {
  if (gender === "male") return "ชาย"
  if (gender === "female") return "หญิง"
  return "อื่น ๆ"
}

export function ageLabel(ageGroup: AgeGroup): string {
  return ageGroup === "child" ? "เด็ก" : "ผู้ใหญ่"
}

export function attendanceLabel(attendance: Attendance): string {
  return attendance === "attending" ? "มาร่วมงาน" : "ส่งความยินดี"
}
