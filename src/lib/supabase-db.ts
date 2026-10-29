import { PARTY_MAX } from "@/lib/event"
import { normalizeThaiMobile } from "@/lib/phone"
import { createSupabaseAdmin } from "@/lib/supabase-admin"
import type { AgeGroup, Attendance, FamilySide, Gender, Guest, Party, Wish } from "@/lib/types"

const WISH_KEEP = 200

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

type PartyRow = {
  phone: string
  updated_at: string
  guests: GuestRow[] | null
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
  return {
    phone,
    updatedAt: party.updatedAt || new Date().toISOString(),
    guests: party.guests.map((guest) => ({ ...guest, partyPhone: phone })),
  }
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
  return {
    phone: row.phone,
    updatedAt: row.updated_at,
    guests: guests.map((guest) => toGuest(guest, row.phone)),
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

const PARTY_SELECT = "phone, updated_at, guests(id, name, gender, age_group, attendance, side, is_companion, position)"

async function savePartyRow(party: Party) {
  const supabase = createSupabaseAdmin()
  const { error } = await supabase.rpc("save_party", {
    p_phone: party.phone,
    p_updated_at: party.updatedAt,
    p_guests: party.guests,
  })
  fail(error, "บันทึกผู้ลงทะเบียนไม่สำเร็จ")
}

export async function readAllParties(): Promise<Party[]> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase.from("parties").select(PARTY_SELECT)
  fail(error, "อ่านข้อมูลผู้ลงทะเบียนไม่สำเร็จ")
  return ((data ?? []) as PartyRow[]).map(toParty)
}

export async function readParty(phone: string): Promise<Party | null> {
  const normalized = normalizeThaiMobile(phone) ?? phone
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase.from("parties").select(PARTY_SELECT).eq("phone", normalized).maybeSingle()
  fail(error, "อ่านข้อมูลไม่สำเร็จ")
  return data ? toParty(data as PartyRow) : null
}

export async function writeParty(party: Party): Promise<void> {
  await savePartyRow(assertParty(party))
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
