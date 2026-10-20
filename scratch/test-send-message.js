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

// Create two clients to simulate two logged in users
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

  console.log("2. Signing in User 2...");
  const { data: auth2, error: err2 } = await supabase2.auth.signInWithPassword({ email: email2, password: pass2 });
  if (err2) throw err2;
  const user2Id = auth2.user.id;

  // Let's create a connection request
  console.log("3. User 1 sending connection request to User 2...");
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

  let reqId;
  if (reqErr) {
    if (reqErr.code === '23505') {
      const { data: existing } = await supabase2
        .from("connection_requests")
        .select("id")
        .eq("sender_id", user1Id)
        .eq("recipient_id", user2Id)
        .single();
      reqId = existing.id;
    } else {
      throw reqErr;
    }
  } else {
    reqId = req.id;
  }

  // User 2 accepts it
  console.log("4. User 2 accepting connection request via RPC...");
  const { data: threadId, error: rpcErr } = await supabase2
    .rpc("accept_connection_rpc", {
      p_request_id: reqId
    });

  if (rpcErr) throw rpcErr;
  console.log("Connection accepted! Thread ID:", threadId);

  // User 2 sends a message in that thread
  console.log("5. User 2 sending a message...");
  const { data: msg, error: msgErr } = await supabase2
    .from("messages")
    .insert({
      thread_id: threadId,
      sender_id: user2Id,
      content: "Thanks for connecting! I would love to talk about exoplanet research."
    })
    .select()
    .single();

  if (msgErr) {
    console.error("Failed to send message:");
    console.error(msgErr);
  } else {
    console.log("Message sent successfully:", msg);
  }
}

main().catch(console.error);
