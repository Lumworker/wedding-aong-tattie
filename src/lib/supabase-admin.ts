import { createClient } from "@supabase/supabase-js"

const MISSING_SECRET =
  "ยังไม่ได้ตั้ง SUPABASE_SECRET_KEY บนเซิร์ฟเวอร์ คัดลอก secret key จาก Supabase ที่ Settings → API Keys แล้วใส่ใน .env.local"

export function createSupabaseAdmin() {
  if (typeof window !== "undefined") {
    throw new Error("Supabase admin client is server-only")
  }
  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SECRET_KEY?.trim()
  if (!url || !key) throw new Error(MISSING_SECRET)

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
