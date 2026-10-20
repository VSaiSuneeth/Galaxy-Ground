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

async function main() {
  const { data: messages, error } = await supabase.from("messages").select("*");
  if (error) {
    console.error("Failed to query messages:", error);
  } else {
    console.log("Messages count:", messages.length);
    console.log(JSON.stringify(messages, null, 2));
  }

  const { data: threads, error: threadErr } = await supabase.from("message_threads").select("*");
  if (threadErr) {
     console.error("Failed to query threads:", threadErr);
  } else {
     console.log("Threads count:", threads.length);
     console.log(JSON.stringify(threads, null, 2));
  }
}

main().catch(console.error);
