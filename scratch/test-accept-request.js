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

const supabase1 = createClient(url, key);
const supabase2 = createClient(url, key);

const email1 = "suneeth0808@gmail.com";
const pass1 = "SAI@@0808";
const email2 = "manideeppasupula5@gmail.com";
const pass2 = "Mani@0852";

async function main() {
  console.log("1. Signing in User 1...");
  const { data: auth1, error: err1 } = await supabase1.auth.signInWithPassword({ email: email1, password: pass1 });
  if (err1) throw err1;
  const user1Id = auth1.user.id;
  console.log("User 1 ID:", user1Id);

  console.log("2. Signing in User 2...");
  const { data: auth2, error: err2 } = await supabase2.auth.signInWithPassword({ email: email2, password: pass2 });
  if (err2) throw err2;
  const user2Id = auth2.user.id;
  console.log("User 2 ID:", user2Id);

  console.log("4. User 1 sending connection request to User 2...");
  let reqId;
  const { data: req, error: reqErr } = await supabase1
    .from("connection_requests")
    .insert({
      sender_id: user1Id,
      recipient_id: user2Id,
      intent_category: "Collaboration",
      context_message: "Let us work on biology"
    })
    .select()
    .maybeSingle();

  if (reqErr) {
    if (reqErr.code === '23505') {
      console.log("Request already exists, fetching the existing one...");
      const { data: existing, error: fetchErr } = await supabase2
        .from("connection_requests")
        .select("id, status")
        .eq("sender_id", user1Id)
        .eq("recipient_id", user2Id)
        .single();
      if (fetchErr) throw fetchErr;
      console.log("Existing request:", existing);
      reqId = existing.id;
    } else {
      console.error("Failed to insert connection request:", reqErr.message);
      return;
    }
  } else {
    console.log("Connection request inserted:", req.id);
    reqId = req.id;
  }

  console.log("5. User 2 accepting connection request via RPC for request ID:", reqId);
  const { data: threadId, error: rpcErr } = await supabase2
    .rpc("accept_connection_rpc", {
      p_request_id: reqId
    });

  if (rpcErr) {
    console.error("RPC failed with error code:", rpcErr.code);
    console.error("Error message:", rpcErr.message);
    console.error(rpcErr);
  } else {
    console.log("RPC Succeeded! Thread ID created/updated:", threadId);
  }
}

main().catch(console.error);
