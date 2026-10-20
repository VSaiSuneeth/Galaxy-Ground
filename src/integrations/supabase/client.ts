import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { getSupabaseEnv } from "@/lib/supabase-env";

const { url, key, missing } = getSupabaseEnv();

if (missing.length) {
  console.error(
    `[Galaxy Ground] Missing ${missing.join(", ")}. Copy .env.example to .env and add keys from Supabase Dashboard → API.`
  );
}

export const supabase = createClient<Database>(url, key, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
