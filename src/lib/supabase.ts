import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && key);

// 환경변수가 없으면 자리표시 값으로 만들고, 화면에서 설정 안내를 보여준다
export const supabase = createClient(url || "http://localhost", key || "missing", {
  auth: { persistSession: false },
});
