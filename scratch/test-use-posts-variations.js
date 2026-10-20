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

const DEFAULT_PAGE_SIZE = 20;

const asArray = (v) => {
  if (Array.isArray(v)) return v;
  if (!v) return [];
  return [v];
};

async function getBoostedMergedFeed(filter = {}, page = 0) {
  const pageSize = filter.pageSize ?? DEFAULT_PAGE_SIZE;
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from("posts")
    .select("id, user_id, content, media_url, media_type, community, hashtags, created_at")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filter.userId) q = q.eq("user_id", filter.userId);
  if (filter.community) q = q.eq("community", filter.community);
  if (filter.hashtag) q = q.contains("hashtags", [filter.hashtag.toLowerCase()]);

  const { data, error } = await q;
  if (error) {
    console.error(`Query failed for filter ${JSON.stringify(filter)}:`, error);
    return null;
  }
  console.log(`Query succeeded for filter ${JSON.stringify(filter)}: found ${data?.length} posts`);
  return data;
}

async function runTests() {
  await getBoostedMergedFeed({ includeAggregated: true, mode: "for-you", pageSize: 15 });
  await getBoostedMergedFeed({ includeAggregated: true, mode: "following", pageSize: 15 });
  await getBoostedMergedFeed({ includeAggregated: true, mode: "recent", pageSize: 15 });
  await getBoostedMergedFeed({ hashtag: "isro", includeAggregated: true });
}

runTests().catch(console.error);
