import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env");

function loadEnv() {
  try {
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
  } catch (e) {
    console.error("Could not read .env file:", e.message);
    process.exit(1);
  }
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, key);

async function cleanup() {
  console.log("Starting DB cleanup for test accounts...");

  const email1 = "suneeth0808@gmail.com";
  const pass1 = "SAI@@0808";
  const email2 = "manideeppasupula5@gmail.com";
  const pass2 = "Mani@0852";

  const { data: auth1, error: authErr1 } = await supabase.auth.signInWithPassword({ email: email1, password: pass1 });
  const { data: auth2, error: authErr2 } = await supabase.auth.signInWithPassword({ email: email2, password: pass2 });

  if (authErr1 || authErr2) {
    console.error("Sign in failed:", authErr1?.message, authErr2?.message);
    console.log("Tests will attempt to run anyway, but connection testing may fail if credentials are wrong.");
    return;
  }

  const id1 = auth1.user.id;
  const id2 = auth2.user.id;
  console.log(`User 1 ID: ${id1}, User 2 ID: ${id2}`);

  // Delete messages, connection requests, and threads between User 1 and User 2
  // We can select the thread IDs first
  const { data: threads } = await supabase
    .from("message_threads")
    .select("id")
    .or(`and(participant_a.eq.${id1},participant_b.eq.${id2}),and(participant_a.eq.${id2},participant_b.eq.${id1})`);

  const threadIds = (threads || []).map(t => t.id);

  if (threadIds.length > 0) {
    console.log("Deleting messages in threads:", threadIds);
    const { error: msgErr } = await supabase
      .from("messages")
      .delete()
      .in("thread_id", threadIds);
    if (msgErr) console.log("Error deleting messages:", msgErr.message);
  }

  // Delete connection requests
  const { error: connErr } = await supabase
    .from("connection_requests")
    .delete()
    .or(`and(requester_id.eq.${id1},recipient_id.eq.${id2}),and(requester_id.eq.${id2},recipient_id.eq.${id1})`);
  
  if (connErr) console.log("Error deleting connection requests:", connErr.message);

  // Delete threads
  if (threadIds.length > 0) {
    const { error: threadErr } = await supabase
      .from("message_threads")
      .delete()
      .in("id", threadIds);
    if (threadErr) console.log("Error deleting threads:", threadErr.message);
  }

  console.log("Cleanup finished.");
}

cleanup().catch(console.error);
