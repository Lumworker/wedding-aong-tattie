import type { Guest } from "@/lib/types"

/** Demo crowd so the church is alive before any real parties join. */
export const SEED_PARTY_PHONE = "seed"

export const SEED_GUESTS: Guest[] = [
  { id: "seed-kan", name: "กานต์", gender: "male", ageGroup: "adult", attendance: "attending", partyPhone: SEED_PARTY_PHONE },
  { id: "seed-min", name: "มินตรา", gender: "female", ageGroup: "adult", attendance: "attending", partyPhone: SEED_PARTY_PHONE },
  { id: "seed-arm", name: "อาร์ม", gender: "male", ageGroup: "adult", attendance: "attending", partyPhone: SEED_PARTY_PHONE },
  { id: "seed-ploy", name: "พลอย", gender: "female", ageGroup: "child", attendance: "attending", partyPhone: SEED_PARTY_PHONE },
  { id: "seed-napa", name: "นภา", gender: "female", ageGroup: "adult", attendance: "attending", partyPhone: SEED_PARTY_PHONE },
  { id: "seed-risa", name: "ริสา", gender: "female", ageGroup: "adult", attendance: "attending", partyPhone: SEED_PARTY_PHONE },
  { id: "seed-wipa", name: "วิภา", gender: "female", ageGroup: "adult", attendance: "not_attending", partyPhone: SEED_PARTY_PHONE },
  { id: "seed-tana", name: "ธนา", gender: "male", ageGroup: "adult", attendance: "not_attending", partyPhone: SEED_PARTY_PHONE },
  { id: "seed-oat", name: "โอ๊ต", gender: "male", ageGroup: "adult", attendance: "not_attending", partyPhone: SEED_PARTY_PHONE },
  { id: "seed-fon", name: "ฝน", gender: "female", ageGroup: "adult", attendance: "not_attending", partyPhone: SEED_PARTY_PHONE },
]
