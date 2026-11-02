import type { Attendance, FamilySide, TravelMode } from "@/lib/types"

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

const TRAVEL_LABEL: Record<TravelMode, string> = {
  drive: "ขับรถมาเอง",
  taxi: "แท็กซี่ / Grab",
  transit: "รถไฟฟ้า / เรือ",
  dropoff: "มีคนมาส่ง",
  unknown: "ยังไม่รู้",
}

export function travelLabel(mode: TravelMode) {
  return TRAVEL_LABEL[mode]
}

/** Pixel icons in public/sprites/steps (ui ux PASS 2026-11-02). Bump ?v= on swap. */
export const STEP_ICON_VERSION = 1

const TRAVEL_ICON: Record<TravelMode, string> = {
  drive: "step-travel-car",
  taxi: "travel-taxi",
  transit: "travel-transit",
  dropoff: "travel-dropoff",
  unknown: "step-travel-car",
}

export function stepIcon(name: string) {
  return `/sprites/steps/${name}.png?v=${STEP_ICON_VERSION}`
}

export function travelIcon(mode: TravelMode | null) {
  return stepIcon(TRAVEL_ICON[mode ?? "drive"])
}
