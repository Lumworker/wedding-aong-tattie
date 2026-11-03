/**
 * Ceremony date is 20 พฤศจิกายน 2570.
 * Changed on purpose to Saturday 20 November (not 5 or 25 December).
 * Every user-facing date string should read `COUPLE.dateThai`.
 */
export const COUPLE = {
  groom: "Chonprakun Panusetgul",
  groomShort: "Chonprakun",
  groomNickname: "อ๋อง",
  bride: "Prachayaphorn Muangphrae",
  brideShort: "Prachayaphorn",
  brideNickname: "แทตตี้",
  dateThai: "20 พฤศจิกายน 2570",
  /** Latin wordmark names (Fraunces, blueberry). */
  groomLatin: "Aong",
  brideLatin: "Tattie",
} as const

export const COUPLE_STORY = {
  lead: "เรื่องของอ๋องกับแทตตี้เริ่มจากคุยกันง่าย ๆ แล้วค่อย ๆ กลายเป็นบ้านเดียวกัน",
  groom:
    "อ๋องเป็นคนละเอียดและชอบทำให้ของที่ยุ่งยากดูเรียบง่าย เวลาอยู่กับเพื่อนมักเป็นคนฟังก่อน แล้วค่อยสรุปให้ทุกคนรู้ว่าจะเดินต่อยังไง",
  bride:
    "แทตตี้เป็นคนอบอุ่น มองรายละเอียดที่คนอื่นข้าม และหัวเราะง่าย งานนี้หลายอย่างผ่านมือเธอ ทั้งโทนสี คำบนการ์ด และความรู้สึกของแขกที่เดินเข้ามา",
  together:
    "ทั้งคู่เลือกวันที่ 20 พฤศจิกายน 2570 เพราะอยากให้คนที่รักมานั่งด้วยกันในวันที่มีแสงนวล ถ้าอยากรู้จักมากกว่าชื่อบนการ์ด ให้กลับไปแตะตัวบนแท่นได้เสมอ",
} as const

/** อาสนวิหารอัสสัมชัญ บางรัก — Assumption Cathedral, Bangkok. */
export const VENUE_MAP = {
  name: "อาสนวิหารอัสสัมชัญ",
  nameEn: "Assumption Cathedral",
  area: "บางรัก",
  address: "23 ซอยเจริญกรุง 40 แขวงบางรัก เขตบางรัก กรุงเทพมหานคร 10500",
  lat: 13.723049,
  lng: 100.514891,
  link: "https://www.google.com/maps/search/?api=1&query=13.723049,100.514891",
  embed: "https://maps.google.com/maps?q=13.723049,100.514891&z=17&hl=th&output=embed",
} as const

export const PARTY_MIN = 1
export const PARTY_MAX = 10

/** 20 พฤศจิกายน 2570 (B.E.) = Saturday 20 November 2027. All-day until the couple fixes a start time. */
export const CEREMONY_DATE_ISO = "2027-11-20"

/** "HH:MM" Bangkok time, or null while not decided — calendar events stay all-day. */
export const CEREMONY_START: string | null = null

/** Thai date string for "please confirm by", or null to just ask unsure guests to update. */
export const RSVP_DEADLINE_THAI: string | null = null

/** Shown right above the save button on the review step (guests who are coming). */
export const DRESS_CODE = {
  title: "การแต่งกาย: สุภาพเรียบร้อย",
  detail: "งานจัดในโบสถ์ ขอความกรุณาแต่งกายสุภาพเรียบร้อยให้เหมาะกับสถานที่",
} as const
