import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  const envPath = resolve(root, ".env");
  const raw = readFileSync(envPath, "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_KEY;
const supabase = createClient(url, key);

// Suneeth's ID
const userId = "ee2cdc16-9f46-4b9d-a055-55745f599aea"; 

async function check() {
  console.log("Checking active threads query for user:", userId);
  const { data, error } = await supabase
    .from("message_threads")
    .select(`
      *,
      profile_a:profiles!message_threads_participant_a_fkey(user_id, username, display_name, avatar_url, show_online_status, last_seen_at),
      profile_b:profiles!message_threads_participant_b_fkey(user_id, username, display_name, avatar_url, show_online_status, last_seen_at)
    `)
    .or(`participant_a.eq.${userId},participant_b.eq.${userId}`);

  if (error) {
    console.error("Query failed:", error.message);
    console.error(error);
  } else {
    console.log("Query succeeded! Threads found:", data.length);
    console.log(JSON.stringify(data, null, 2));
  }
}

check().catch(console.error);
