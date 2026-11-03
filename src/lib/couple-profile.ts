/**
 * What guests read on /about/aong and /about/tattie.
 * Sections whose content is missing (empty arrays / null) are hidden, so the couple
 * can fill them in later without touching the pages.
 */

export type CareerStep = { years: string; company: string; role: string; current?: boolean }
export type BrandWork = { name: string; kind: string }

export const AONG_PROFILE = {
  role: "Full-stack Developer",
  company: "True Corporation",
  about:
    "เขียนเว็บมาหลายปี ทั้งหน้าบ้านและหลังบ้าน ศิษย์เก่าศิลปากร และเว็บงานแต่งที่คุณเปิดอยู่นี้ อ๋องก็ลงมือเขียนเอง",
  /** Newest first. 2018–2019 left out on purpose (kept short). */
  career: [
    { years: "2026 – now", company: "True Corporation", role: "Full-stack Developer", current: true },
    { years: "2024 – 26", company: "Q-CHANG คิวช่าง", role: "Frontend Developer" },
    { years: "2022 – 24", company: "Riverpark Consultant", role: "Frontend Developer" },
    { years: "2019 – 22", company: "PATKOL", role: "Full Stack Engineer" },
  ] satisfies CareerStep[],
  /** Chosen by Tattie. Empty = section hidden. */
  threeWords: [] as string[],
  /** Aong writing about Tattie. null = section hidden. */
  letter: null as string | null,
}

export const TATTIE_PROFILE = {
  role: "Content Planner",
  headline: "Content Planner มือทอง",
  about: "เบื้องหลังคอนเทนต์ของสื่อและแบรนด์ความงามในไทย คิดว่าจะเล่าอะไร เล่ายังไง ให้คนหยุดดู แล้วอยากกดต่อ",
  brands: [
    { name: "Kaidee", kind: "แพลตฟอร์มซื้อขาย" },
    { name: "RS", kind: "สื่อ · บันเทิง" },
    { name: "9 Beauty", kind: "ความงาม" },
    { name: "CJ MORE", kind: "ค้าปลีก" },
  ] satisfies BrandWork[],
  /** Chosen by Aong. Empty = section hidden. */
  threeWords: [] as string[],
  /** Tattie writing about Aong. null = section hidden. */
  letter: null as string | null,
}
