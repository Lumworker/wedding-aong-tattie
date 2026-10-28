/**
 * Ceremony date is 5 ธันวาคม 2570.
 * Kept on purpose after the explicit date fix (not 25 December).
 * Every user-facing date string should read `COUPLE.dateThai`.
 */
export const COUPLE = {
  groom: "Chonprakun Panusetgul",
  groomShort: "Chonprakun",
  groomNickname: "อ๋อง",
  bride: "Prachayaphorn Muangphrae",
  brideShort: "Prachayaphorn",
  brideNickname: "แทตตี้",
  dateThai: "5 ธันวาคม 2570",
} as const

export const COUPLE_STORY = {
  lead: "เรื่องของอ๋องกับแทตตี้เริ่มจากคุยกันง่าย ๆ แล้วค่อย ๆ กลายเป็นบ้านเดียวกัน",
  groom:
    "อ๋องเป็นคนละเอียดและชอบทำให้ของที่ยุ่งยากดูเรียบง่าย เวลาอยู่กับเพื่อนมักเป็นคนฟังก่อน แล้วค่อยสรุปให้ทุกคนรู้ว่าจะเดินต่อยังไง",
  bride:
    "แทตตี้เป็นคนอบอุ่น มองรายละเอียดที่คนอื่นข้าม และหัวเราะง่าย งานนี้หลายอย่างผ่านมือเธอ ทั้งโทนสี คำบนการ์ด และความรู้สึกของแขกที่เดินเข้ามา",
  together:
    "ทั้งคู่เลือกวันที่ 5 ธันวาคม 2570 เพราะอยากให้คนที่รักมานั่งด้วยกันในวันที่มีแสงนวล ถ้าอยากรู้จักมากกว่าชื่อบนการ์ด ให้กลับไปแตะตัวบนแท่นได้เสมอ",
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
