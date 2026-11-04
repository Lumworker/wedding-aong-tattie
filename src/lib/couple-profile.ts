/**
 * What guests read on /about/aong and /about/tattie: who each of them is, not a CV.
 * Sections whose content is missing (empty arrays / null) are hidden, so the couple
 * can fill them in later without touching the pages.
 */

export type Trait = { fn: string; title: string; text: string }
export type Love = { key: "yoga" | "pretty" | "books" | "stones"; title: string; text: string }

export const AONG_PROFILE = {
  intro:
    "อ๋องเป็นคนที่ถ้าลงมือกับอะไรแล้ว จะไม่หยุดแค่ผิว ๆ ต้องขุดให้ถึงแก่นว่ามันทำงานยังไง ทั้งเหล็กในยิม กระทะในครัว และโค้ดบนจอ",
  /** Shown as features of aong.exe. */
  traits: [
    { fn: "lift()", title: "สายเวท", text: "ออกกำลังกายสม่ำเสมอ และเล่นเวทแบบจริงจัง ไม่ใช่แค่ไปยิมให้ครบวัน" },
    { fn: "cook()", title: "พ่อครัวประจำบ้าน", text: "เข้าครัวเองบ่อย และทำอร่อยจริง ไม่ได้อวยกันเอง ถามแทตตี้ได้" },
    { fn: "deepDive()", title: "ลงมือถึงแก่น", text: "อะไรที่สนใจ จะทำจนเข้าใจถึงแก่นแท้ของมันเสมอ ไม่เคยทำแค่พอผ่าน" },
  ] satisfies Trait[],
  knownIssue: {
    title: "เบื่อไวอย่างไม่น่าเชื่อ",
    text: "อีกด้านของคนที่ทุ่มสุดตัว คือถ้าสิ่งที่ทำอยู่ไม่มีอะไรให้ตื่นเต้นแล้ว ไฟจะมอดเร็วจนตกใจ",
    status: "won't fix · ยกเว้นเรื่องแทตตี้ อันนี้ไม่เคยเบื่อ",
  },
  dayJob: "งานประจำ: Full-stack Developer ที่ True Corporation · เว็บนี้ก็อ๋องเขียนเอง",
  /** Chosen by Tattie. Empty = section hidden. */
  threeWords: [] as string[],
  /** Aong writing about Tattie. null = section hidden. */
  letter: null as string | null,
}

export const TATTIE_PROFILE = {
  intro:
    "ผู้หญิงสมัยใหม่ที่ชอบให้ชีวิตมีที่ว่างพอสำหรับของสวย ๆ หนังสือดี ๆ และลมหายใจยาว ๆ บนเสื่อโยคะ",
  loves: [
    { key: "yoga", title: "โยคะ", text: "วันไหนวุ่นวาย แทตตี้จะกลับไปหาเสื่อผืนเดิม ยืดตัว หายใจ แล้วค่อยกลับมาเป็นคนใจดีอีกครั้ง" },
    { key: "pretty", title: "ของสวย ๆ น่ารัก ๆ", text: "ของชิ้นเล็กที่สวยถูกใจ ทำให้วันธรรมดาทั้งวันดีขึ้นได้จริง" },
    { key: "books", title: "นักอ่าน", text: "มีเล่มที่อ่านค้างอยู่ข้างเตียงเสมอ และมักมีอีกเล่มรอต่อคิว" },
    { key: "stones", title: "นักสะสมหิน", text: "หินแต่ละก้อนมีสี มีลาย และมีเรื่องของมัน แทตตี้เลยค่อย ๆ เก็บไว้ทีละก้อน" },
  ] satisfies Love[],
  /** Closing "column" paragraph, written in her old columnist voice. */
  column:
    "ถ้าให้เขียนคอลัมน์ถึงตัวเองสักย่อหน้า แทตตี้คงบอกว่า ชีวิตที่ดีไม่ต้องหวือหวา ขอแค่มีของสวยให้มอง มีหนังสือดีให้อ่าน และมีคนที่ใช่ให้กลับบ้านไปหา",
  dayJob: "งานประจำ: Content Planner เบื้องหลังคอนเทนต์ความงาม · เคยเป็นฟรีแลนซ์เขียนคอลัมน์และ copywriting",
  /** Chosen by Aong. Empty = section hidden. */
  threeWords: [] as string[],
  /** Tattie writing about Aong. null = section hidden. */
  letter: null as string | null,
}
