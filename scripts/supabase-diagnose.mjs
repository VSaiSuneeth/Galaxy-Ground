/**
 * Runtime Supabase diagnostics — run: node scripts/supabase-diagnose.mjs
 */
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
const key =
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_ANON_KEY ||
  env.VITE_SUPABASE_KEY;

console.log("=== Supabase Connection Diagnostics ===\n");
console.log("URL:", url || "(missing)");
console.log("Key present:", !!key);
console.log("Key prefix:", key ? key.slice(0, 20) + "..." : "(none)");
console.log("Key env vars:", {
  PUBLISHABLE: !!env.VITE_SUPABASE_PUBLISHABLE_KEY,
  ANON: !!env.VITE_SUPABASE_ANON_KEY,
});

if (!url || !key) {
  console.error("\nFATAL: Missing VITE_SUPABASE_URL or API key");
  process.exit(1);
}

const supabase = createClient(url, key);

const tables = [
  "profiles",
  "posts",
  "startup_posts",
  "themed_posts",
  "comments",
  "likes",
  "bookmarks",
  "follows",
  "notifications",
  "aggregate_reactions",
  "aggregate_comments",
  "startups",
  "themed_accounts",
  "post_stats",
];

async function countTable(name) {
  const { count, error } = await supabase.from(name).select("*", { count: "exact", head: true });
  return { count: count ?? null, error: error?.message ?? null, code: error?.code ?? null };
}

async function main() {
  // Health: REST root
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    console.log("\nREST health:", res.status, res.statusText);
  } catch (e) {
    console.log("\nREST health FAILED:", e.message);
  }

  // Auth settings probe (anon)
  const { data: authSettings, error: authErr } = await supabase.auth.getSession();
  console.log("\nAuth client init:", authErr ? `ERROR: ${authErr.message}` : "OK (no session expected)");

  console.log("\n--- Table row counts (anon key) ---");
  const results = [];
  for (const t of tables) {
    const r = await countTable(t);
    results.push({ table: t, ...r });
    const status = r.error ? `ERROR [${r.code}] ${r.error}` : String(r.count);
    console.log(`${t.padEnd(22)} ${status}`);
  }

  // Sample data
  console.log("\n--- Sample queries ---");
  for (const q of [
    { label: "posts (3 latest)", table: "posts", select: "id, user_id, created_at", order: "created_at", limit: 3 },
    { label: "profiles (3)", table: "profiles", select: "user_id, username", limit: 3 },
    { label: "startup_posts (3)", table: "startup_posts", select: "id, title", limit: 3 },
    { label: "themed_posts (3)", table: "themed_posts", select: "id, title", limit: 3 },
  ]) {
    let query = supabase.from(q.table).select(q.select);
    if (q.order) query = query.order(q.order, { ascending: false });
    if (q.limit) query = query.limit(q.limit);
    const { data, error } = await query;
    console.log(`\n${q.label}:`, error ? `ERROR: ${error.message}` : JSON.stringify(data, null, 0));
  }

  // Storage
  console.log("\n--- Storage buckets ---");
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
  if (bErr) console.log("ERROR:", bErr.message);
  else console.log(buckets?.map((b) => `${b.id} (public=${b.public})`).join(", ") || "(none)");

  // Signup test with disposable email (optional — skip if rate limited)
  const testEmail = `diag_${Date.now()}@galaxyground.test`;
  const testPass = "DiagTest123!";
  console.log("\n--- Auth signup probe ---");
  const { data: signUp, error: signUpErr } = await supabase.auth.signUp({
    email: testEmail,
    password: testPass,
    options: {
      data: { username: "diaguser", display_name: "Diag User" },
    },
  });
  if (signUpErr) {
    console.log("signUp ERROR:", signUpErr.message, signUpErr.status);
  } else {
    console.log("signUp user id:", signUp.user?.id);
    console.log("session:", signUp.session ? "YES (email confirm off)" : "NO (confirm email on?)");
    if (signUp.session) {
      const uid = signUp.user.id;
      const { data: prof, error: pErr } = await supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle();
      console.log("profile after trigger:", pErr ? `ERROR: ${pErr.message}` : JSON.stringify(prof));
      // Legacy bug: inserting id=user.id breaks signup; trigger should have created profile
      const dup = await supabase.from("profiles").insert({
        user_id: uid,
        username: "dup_test",
        display_name: "Dup",
      });
      console.log(
        "manual profile insert (should fail if trigger worked):",
        dup.error ? `EXPECTED/conflict: ${dup.error.message}` : "inserted (trigger may be missing)"
      );
    }
  }

  console.log("\n=== Done ===");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
