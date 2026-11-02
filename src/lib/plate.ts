/** Thai car plates: normalize for duplicate checks, loose shape check, province list. */

const THAI_DIGITS = "๐๑๒๓๔๕๖๗๘๙"

/** Strip spaces, dashes and dots; Thai digits → Arabic. "1กข-1234" and "๑ กข ๑๒๓๔" match. */
export function normalizePlate(input: string) {
  return input
    .normalize("NFC")
    .replace(/[๐-๙]/g, (digit) => String(THAI_DIGITS.indexOf(digit)))
    .replace(/[\s\-.]/g, "")
}

/**
 * Typical shapes: optional leading digit, 1–3 Thai consonants, 1–4 digits ("1กข1234"),
 * or the all-digit van/truck style ("70-1234" → "701234"). Special plates may not match.
 */
export function looksLikePlate(normalized: string) {
  return /^[0-9]?[ก-ฮ]{1,3}[0-9]{1,4}$/.test(normalized) || /^[0-9]{2}[0-9]{4}$/.test(normalized)
}

export const DEFAULT_PROVINCE = "กรุงเทพมหานคร"

export const PROVINCES = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี",
  "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด",
  "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี",
  "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี",
  "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์",
  "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง",
  "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล",
  "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย",
  "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ",
  "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี",
] as const

export function isProvince(value: string) {
  return (PROVINCES as readonly string[]).includes(value)
}
