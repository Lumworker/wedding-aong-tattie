import { PARTY_MAX } from "@/lib/event"
import { normalizeThaiMobile } from "@/lib/phone"
import { isProvince, normalizePlate } from "@/lib/plate"
import { createSupabaseAdmin } from "@/lib/supabase-admin"
import type { AgeGroup, Attendance, FamilySide, Gender, Guest, Party, Travel, TravelMode, Wish } from "@/lib/types"

/** Another party already registered this plate + province. */
export class PlateTakenError extends Error {
  constructor(
    readonly plateNorm: string,
    readonly province: string
  ) {
    super("ทะเบียนนี้มีคนลงไว้แล้ว ถ้ามาคันเดียวกันไม่ต้องเพิ่มรถ หรือติดต่อบ่าวสาว")
    this.name = "PlateTakenError"
  }
}

const TRAVEL_MODES: TravelMode[] = ["drive", "taxi", "transit", "dropoff", "unknown"]
const CAR_MAX = 3

const WISH_KEEP = 200
/** Matches parties_story_len in migration 20261103090000_party_story. */
export const STORY_MAX = 1000

type GuestRow = {
  id: string
  name: string
  gender: Gender
  age_group: AgeGroup
  attendance: Attendance
  side: FamilySide | null
  is_companion: boolean
  position: number
}

type CarRow = {
  id: string
  plate_raw: string
  province: string
  position: number
}

type PartyRow = {
  phone: string
  updated_at: string
  guests: GuestRow[] | null
  travel_mode?: TravelMode | null
  needs_parking?: boolean | null
  party_cars?: CarRow[] | null
  story?: string | null
}

type WishRow = {
  id: string
  message: string
  from_name: string
  party_phone: string
  created_at: string
}

function fail(error: { message: string } | null, fallback: string) {
  if (!error) return
  const message = error.message ?? ""
  const taken = /ทะเบียนซ้ำ:([^:]*):(.*)$/.exec(message)
  if (taken) throw new PlateTakenError(taken[1], taken[2].trim())
  if (message.includes("เบอร์โทรไม่ถูกต้อง")) throw new Error("เบอร์โทรไม่ถูกต้อง")
  if (message.includes("จำนวนคนในกลุ่ม")) throw new Error("จำนวนคนในกลุ่มต้องอยู่ระหว่าง 1 ถึง 10")
  if (message.includes("ผู้ลงทะเบียนหลัก")) throw new Error("ต้องมีผู้ลงทะเบียนหลักหนึ่งคน")
  if (message.includes("parties_phone_thai_mobile") || message.includes("wishes_party_phone_fkey")) {
    throw new Error("กรุณาลงทะเบียนก่อนฝากคำอวยพร")
  }
  throw new Error(fallback)
}

function assertParty(party: Party): Party {
  const phone = normalizeThaiMobile(party.phone)
  if (!phone) throw new Error("เบอร์โทรไม่ถูกต้อง")
  if (!Array.isArray(party.guests) || party.guests.length < 1 || party.guests.length > PARTY_MAX) {
    throw new Error("จำนวนคนในกลุ่มต้องอยู่ระหว่าง 1 ถึง 10")
  }
  if (party.guests.filter((guest) => !guest.isCompanion).length !== 1) {
    throw new Error("ต้องมีผู้ลงทะเบียนหลักหนึ่งคน")
  }
  const main = party.guests.find((guest) => !guest.isCompanion)
  return {
    phone,
    updatedAt: party.updatedAt || new Date().toISOString(),
    guests: party.guests.map((guest) => ({ ...guest, partyPhone: phone })),
    travel: cleanTravel(party.travel, main?.attendance),
    story: cleanStory(party.story),
  }
}

function cleanStory(input: unknown): string | undefined {
  if (typeof input !== "string") return undefined
  const glyphs = Array.from(input.trim())
  if (!glyphs.length) return ""
  return glyphs.slice(0, STORY_MAX).join("")
}

/** Server-side rules for travel: cars only when driving and asking for parking. */
function cleanTravel(input: Travel | undefined, attendance: Attendance | undefined): Travel {
  const none: Travel = { mode: null, needsParking: null, cars: [] }
  if (!input || attendance === "declined") return none
  const mode = TRAVEL_MODES.includes(input.mode as TravelMode) ? (input.mode as TravelMode) : null
  const needsParking = mode === "drive" && typeof input.needsParking === "boolean" ? input.needsParking : null
  if (!needsParking) return { mode, needsParking, cars: [] }

  const cars = Array.isArray(input.cars) ? input.cars.slice(0, CAR_MAX) : []
  if (cars.length < 1) throw new Error("กรุณากรอกทะเบียนรถอย่างน้อย 1 คัน")
  const seen = new Set<string>()
  const clean = cars.map((car, index) => {
    const plate = typeof car.plate === "string" ? car.plate.trim() : ""
    const norm = normalizePlate(plate)
    if (norm.length < 2 || norm.length > 10) throw new Error(`ทะเบียนคันที่ ${index + 1} ไม่ถูกต้อง`)
    if (!isProvince(car.province)) throw new Error(`กรุณาเลือกจังหวัดของคันที่ ${index + 1}`)
    const key = `${norm}|${car.province}`
    if (seen.has(key)) throw new Error("กรอกทะเบียนเดียวกันซ้ำในกลุ่ม")
    seen.add(key)
    return { id: car.id || `car_${index}`, plate, province: car.province }
  })
  return { mode, needsParking, cars: clean }
}

function toGuest(row: GuestRow, phone: string): Guest {
  return {
    id: row.id,
    name: row.name,
    gender: row.gender,
    ageGroup: row.age_group,
    attendance: row.attendance,
    side: row.side ?? undefined,
    partyPhone: phone,
    ...(row.is_companion ? { isCompanion: true } : {}),
  }
}

function toParty(row: PartyRow): Party {
  const guests = [...(row.guests ?? [])].sort((left, right) => left.position - right.position)
  const cars = [...(row.party_cars ?? [])].sort((left, right) => left.position - right.position)
  return {
    phone: row.phone,
    updatedAt: row.updated_at,
    guests: guests.map((guest) => toGuest(guest, row.phone)),
    travel: {
      mode: row.travel_mode ?? null,
      needsParking: row.needs_parking ?? null,
      cars: cars.map((car) => ({ id: car.id, plate: car.plate_raw, province: car.province })),
    },
    ...(typeof row.story === "string" ? { story: row.story } : {}),
  }
}

function toWish(row: WishRow): Wish {
  return {
    id: row.id,
    text: row.message,
    from: row.from_name,
    partyPhone: row.party_phone,
    createdAt: row.created_at,
  }
}

const GUEST_SELECT = "guests(id, name, gender, age_group, attendance, side, is_companion, position)"
const PARTY_SELECT_V1 = `phone, updated_at, ${GUEST_SELECT}`
const PARTY_SELECT_V2 = `${PARTY_SELECT_V1}, travel_mode, needs_parking, party_cars(id, plate_raw, province, position)`

/**
 * True once migration 20261102120000_travel_parking has run. Until then the app
 * keeps working and saves parties without travel data.
 */
let travelSchema: { ok: boolean; at: number } | null = null
async function hasTravelSchema() {
  if (travelSchema && (travelSchema.ok || Date.now() - travelSchema.at < 60_000)) return travelSchema.ok
  const supabase = createSupabaseAdmin()
  const { error } = await supabase.from("party_cars").select("id").limit(1)
  travelSchema = { ok: !error, at: Date.now() }
  if (error) console.warn("travel schema missing — run supabase/migrations/20261102120000_travel_parking.sql")
  return travelSchema.ok
}

/** True once migration 20261103090000_party_story has run; until then stories are not saved. */
let storySchema: { ok: boolean; at: number } | null = null
async function hasStorySchema() {
  if (storySchema && (storySchema.ok || Date.now() - storySchema.at < 60_000)) return storySchema.ok
  const supabase = createSupabaseAdmin()
  const { error } = await supabase.from("parties").select("story").limit(1)
  storySchema = { ok: !error, at: Date.now() }
  if (error) console.warn("story column missing — run supabase/migrations/20261103090000_party_story.sql")
  return storySchema.ok
}

async function partySelect() {
  const base = (await hasTravelSchema()) ? PARTY_SELECT_V2 : PARTY_SELECT_V1
  return (await hasStorySchema()) ? `${base}, story` : base
}

async function saveStory(party: Party) {
  if (party.story === undefined || !(await hasStorySchema())) return
  const supabase = createSupabaseAdmin()
  const { error } = await supabase
    .from("parties")
    .update({ story: party.story || null })
    .eq("phone", party.phone)
  fail(error, "บันทึกเรื่องเล่าไม่สำเร็จ")
}

async function savePartyRow(party: Party) {
  const supabase = createSupabaseAdmin()
  if (await hasTravelSchema()) {
    const travel = party.travel ?? { mode: null, needsParking: null, cars: [] }
    const { error } = await supabase.rpc("save_party_v2", {
      p_phone: party.phone,
      p_updated_at: party.updatedAt,
      p_guests: party.guests,
      p_travel: {
        mode: travel.mode,
        needsParking: travel.needsParking,
        cars: travel.cars.map((car, position) => ({
          id: car.id,
          plate: car.plate,
          plateNorm: normalizePlate(car.plate),
          province: car.province,
          position,
        })),
      },
    })
    fail(error, "บันทึกผู้ลงทะเบียนไม่สำเร็จ")
    return
  }
  const { error } = await supabase.rpc("save_party", {
    p_phone: party.phone,
    p_updated_at: party.updatedAt,
    p_guests: party.guests,
  })
  fail(error, "บันทึกผู้ลงทะเบียนไม่สำเร็จ")
}

export async function readAllParties(): Promise<Party[]> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase.from("parties").select(await partySelect())
  fail(error, "อ่านข้อมูลผู้ลงทะเบียนไม่สำเร็จ")
  return ((data ?? []) as unknown as PartyRow[]).map(toParty)
}

export async function readParty(phone: string): Promise<Party | null> {
  const normalized = normalizeThaiMobile(phone) ?? phone
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from("parties")
    .select(await partySelect())
    .eq("phone", normalized)
    .maybeSingle()
  fail(error, "อ่านข้อมูลไม่สำเร็จ")
  return data ? toParty(data as unknown as PartyRow) : null
}

export async function writeParty(party: Party): Promise<void> {
  const clean = assertParty(party)
  await savePartyRow(clean)
  await saveStory(clean)
}

export async function deleteParty(phone: string): Promise<void> {
  const normalized = normalizeThaiMobile(phone)
  if (!normalized) throw new Error("เบอร์โทรไม่ถูกต้อง")
  const supabase = createSupabaseAdmin()
  const { error } = await supabase.from("parties").delete().eq("phone", normalized)
  fail(error, "ลบการลงทะเบียนไม่สำเร็จ")
}

export async function upsertParties(parties: Party[]): Promise<void> {
  for (const party of parties) {
    await savePartyRow(assertParty(party))
  }
}

export async function readWishes(): Promise<Wish[]> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from("wishes")
    .select("id, message, from_name, party_phone, created_at")
    .order("created_at", { ascending: true })
    .limit(WISH_KEEP)
  fail(error, "อ่านความคิดเห็นไม่สำเร็จ")
  return ((data ?? []) as WishRow[]).map(toWish)
}

export async function writeWish(wish: Wish): Promise<void> {
  const phone = normalizeThaiMobile(wish.partyPhone)
  if (!phone) throw new Error("เบอร์โทรไม่ถูกต้อง")
  const supabase = createSupabaseAdmin()
  const { error } = await supabase.from("wishes").insert({
    id: wish.id,
    message: wish.text,
    from_name: wish.from,
    party_phone: phone,
    created_at: wish.createdAt,
  })
  fail(error, "บันทึกความคิดเห็นไม่สำเร็จ")
}

/** Phone of the party that wrote a wish, or null when it does not exist. */
export async function readWishOwner(id: string): Promise<string | null> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase.from("wishes").select("party_phone").eq("id", id).maybeSingle()
  fail(error, "อ่านความคิดเห็นไม่สำเร็จ")
  return (data as { party_phone: string } | null)?.party_phone ?? null
}

export async function updateWish(wish: Wish): Promise<void> {
  const phone = normalizeThaiMobile(wish.partyPhone)
  if (!phone) throw new Error("เบอร์โทรไม่ถูกต้อง")
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from("wishes")
    .update({
      message: wish.text,
      from_name: wish.from,
      party_phone: phone,
    })
    .eq("id", wish.id)
    .select("id")
  fail(error, "แก้ไขความคิดเห็นไม่สำเร็จ")
  if (!data?.length) throw new Error("ไม่พบคำอวยพรที่จะแก้ไข")
}

export async function replaceWishes(wishes: Wish[]): Promise<void> {
  const supabase = createSupabaseAdmin()
  const { error: deleteError } = await supabase.from("wishes").delete().not("id", "is", null)
  fail(deleteError, "สร้างข้อมูล mock ไม่สำเร็จ")
  const rows = wishes.slice(-WISH_KEEP).map((wish) => {
    const phone = normalizeThaiMobile(wish.partyPhone)
    if (!phone) throw new Error("เบอร์โทรไม่ถูกต้อง")
    return {
      id: wish.id,
      message: wish.text,
      from_name: wish.from,
      party_phone: phone,
      created_at: wish.createdAt,
    }
  })
  if (!rows.length) return
  const { error } = await supabase.from("wishes").insert(rows)
  fail(error, "สร้างข้อมูล mock ไม่สำเร็จ")
}
