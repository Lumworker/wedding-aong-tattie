import { CEREMONY_DATE_ISO, CEREMONY_START, COUPLE, VENUE_MAP } from "@/lib/event"

const TITLE = `งานแต่งงาน ${COUPLE.groomNickname} & ${COUPLE.brideNickname}`
const PLACE = `${VENUE_MAP.name}, ${VENUE_MAP.address}`

function compact(date: string) {
  return date.replaceAll("-", "")
}

function nextDay(date: string) {
  const day = new Date(`${date}T00:00:00Z`)
  day.setUTCDate(day.getUTCDate() + 1)
  return day.toISOString().slice(0, 10)
}

/** Bangkok "HH:MM" on the ceremony day → UTC "YYYYMMDDTHHMMSSZ", plus 4 hours for the end. */
function timed(start: string) {
  const at = new Date(`${CEREMONY_DATE_ISO}T${start}:00+07:00`)
  const end = new Date(at.getTime() + 4 * 60 * 60 * 1000)
  const stamp = (value: Date) => value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
  return [stamp(at), stamp(end)] as const
}

function range() {
  if (CEREMONY_START) return timed(CEREMONY_START)
  return [compact(CEREMONY_DATE_ISO), compact(nextDay(CEREMONY_DATE_ISO))] as const
}

export function googleCalendarUrl(details: string) {
  const [start, end] = range()
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: TITLE,
    dates: `${start}/${end}`,
    location: PLACE,
    details,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (match) => `\\${match}`)
}

/** iPhone / Outlook: a data URL the browser hands to the calendar app. */
export function icsDataUrl(details: string) {
  const [start, end] = range()
  const dated = CEREMONY_START ? [`DTSTART:${start}`, `DTEND:${end}`] : [`DTSTART;VALUE=DATE:${start}`, `DTEND;VALUE=DATE:${end}`]
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//wedding-aong-tattie//TH",
    "BEGIN:VEVENT",
    `UID:wedding-aong-tattie-${CEREMONY_DATE_ISO}@invite`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    ...dated,
    `SUMMARY:${escapeIcs(TITLE)}`,
    `LOCATION:${escapeIcs(PLACE)}`,
    `DESCRIPTION:${escapeIcs(details)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(body)}`
}
