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

async function check() {
  console.log("Checking badge_awards query...");
  const { data, error } = await supabase
    .from("badge_awards")
    .select(`
      id,
      user_id,
      badge_id,
      awarded_at
    `)
    .limit(5);

  if (error) {
    console.error("badge_awards failed:", error.message);
  } else {
    console.log("badge_awards succeeded! Data count:", data.length);
  }

  console.log("Checking profile_badge_awards query...");
  const { data: data2, error: error2 } = await supabase
    .from("profile_badge_awards")
    .select("*")
    .limit(5);

  if (error2) {
    console.error("profile_badge_awards failed:", error2.message);
  } else {
    console.log("profile_badge_awards succeeded! Data count:", data2.length);
  }
}

check().catch(console.error);
