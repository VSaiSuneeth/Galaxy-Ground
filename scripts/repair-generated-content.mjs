import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadDotEnv() {
  const values = {};
  try {
    const raw = readFileSync(resolve(ROOT, ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const index = trimmed.indexOf("=");
      values[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim();
    }
  } catch {
    // .env is optional because secrets should usually come from the shell.
  }
  return values;
}

const env = { ...loadDotEnv(), ...process.env };
const SUPABASE_URL = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing required Supabase environment values:");
  console.error(`- SUPABASE_URL/VITE_SUPABASE_URL: ${SUPABASE_URL ? "found" : "missing"}`);
  console.error(`- SUPABASE_SERVICE_KEY/SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_KEY ? "found" : "missing"}`);
  console.error("Set the service_role key only in your local terminal. Do not paste it into chat.");
  process.exit(1);
}

if (SUPABASE_SERVICE_KEY.startsWith("sb_publishable_")) {
  console.error("Refusing to run with a publishable/anon key. Use the service_role secret key locally.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const MIN_CHARS = 500;
const PLACEHOLDER_PATTERNS = [
  /this is a long regenerated content/i,
  /ensure it meets the quality requirement/i,
  /being at least 500 characters long/i,
];

const IMAGE_POOL = [
  "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=85",
];

const TAGS_BY_CATEGORY = {
  astrophotography: ["astrophotography", "nightsky", "stargazing", "astronomy", "space"],
  "rocket engineering": ["rocket", "propulsion", "launch", "aerospace", "space"],
  "launch vehicles": ["rocket", "launch", "aerospace", "spaceindustry", "space"],
  "satellite manufacturers": ["satellite", "spaceindustry", "earthobservation", "aerospace", "space"],
  "space data & analytics": ["spacedata", "earthobservation", "geospatial", "satellite", "space"],
  "indian space program": ["isro", "india", "space", "satellite", "gaganyaan"],
  "space policy and law": ["spacepolicy", "spacelaw", "regulation", "space", "policy"],
  astrobiology: ["astrobiology", "exoplanets", "science", "space", "life"],
};

function clean(value) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function normalize(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function hashIndex(value, modulo) {
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % modulo;
}

function stripRepeatedTitle(title, body) {
  const normalizedTitle = normalize(title);
  const normalizedBody = normalize(body);
  if (!normalizedTitle || !normalizedBody) return body;
  if (normalizedBody === normalizedTitle) return "";
  if (!normalizedBody.startsWith(normalizedTitle)) return body;
  return body.slice(Math.min(body.length, title.length)).replace(/^\s*[:\-.]?\s*/, "").trim();
}

function validTags(row, fallbackCategory, kind) {
  const tags = new Set();
  for (const raw of row.hashtags || []) {
    const tag = clean(raw).replace(/^#+/, "").toLowerCase();
    if (/^[a-z0-9_]{2,40}$/.test(tag)) tags.add(tag);
  }

  const category = normalize(fallbackCategory);
  for (const tag of TAGS_BY_CATEGORY[category] || []) tags.add(tag);
  if (kind === "startup") tags.add("startup");
  if (tags.size < 3) {
    tags.add("space");
    tags.add("technology");
    tags.add("innovation");
  }
  return Array.from(tags).slice(0, 6);
}

function makeRichContent({ title, body, category, author, kind }) {
  const safeTitle = clean(title) || "Space update";
  const safeCategory = clean(category) || (kind === "startup" ? "space industry" : "space exploration");
  const safeAuthor = clean(author) || (kind === "startup" ? "this startup" : "this creator");
  const existing = stripRepeatedTitle(safeTitle, clean(body));

  if (
    existing.length >= MIN_CHARS &&
    normalize(existing) !== normalize(safeTitle) &&
    !PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(existing))
  ) {
    return existing;
  }

  if (kind === "startup") {
    return [
      `${safeAuthor}'s update, "${safeTitle}", deserves a closer look because it connects a single headline to the wider execution story inside ${safeCategory}. The significance is not only the announcement itself, but what it suggests about technical readiness, partnerships, market timing, and the ability to move from promising development work into reliable operations.`,
      `For customers, investors, suppliers, and regulators, the most important signals will be measurable progress: clearer timelines, payload or product readiness, operational transparency, and evidence that the team can repeat the milestone rather than treat it as a one-off success. Those details shape confidence across the commercial space ecosystem and influence how quickly new services can move from demonstration to adoption.`,
      `Galaxy Ground will continue watching for official updates, source evidence, images, performance data, and follow-on milestones. Whether the next step confirms momentum or exposes hard engineering lessons, it will help define how ${safeAuthor} fits into the next phase of space technology and commercial infrastructure.`,
    ].join("\n\n");
  }

  return [
    `${safeTitle}. For followers of ${safeCategory.toLowerCase()}, this is more than a passing headline. It gives the community a useful reason to look closer at the observation, mission context, visual evidence, and the scientific or cultural story behind the update.`,
    `The strongest space posts become meaningful when they move beyond a name or image and explain why the moment matters. Details such as the object being studied, the instrument involved, the processing method, and the follow-up evidence help separate a beautiful snapshot from a durable contribution to astronomy and public understanding.`,
    `Galaxy Ground will keep watching for official releases, better-resolution media, confirmed measurements, and the next milestone that adds substance to the story. For now, this update gives space followers a clearer entry point into the larger conversation around discovery, imaging, exploration, and the way people connect with the night sky.`,
  ].join("\n\n");
}

function needsRepair(row) {
  const body = stripRepeatedTitle(row.title, clean(row.content || row.summary));
  return (
    PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(body)) ||
    body.length < MIN_CHARS ||
    normalize(body) === normalize(row.title) ||
    !clean(row.image_url) ||
    !Array.isArray(row.hashtags) ||
    row.hashtags.length === 0
  );
}

function summaryFrom(content) {
  const compact = clean(content);
  return compact.length > 220 ? `${compact.slice(0, 217)}...` : compact;
}

async function fetchRows(table) {
  const select =
    table === "startup_posts"
      ? "id,title,content,summary,image_url,hashtags,startups(name,category)"
      : "id,title,content,summary,image_url,hashtags,themed_accounts(display_name,category)";
  const { data, error } = await supabase.from(table).select(select).limit(1000);
  if (error) throw error;
  return data || [];
}

async function updateBatch(table, rows) {
  let updated = 0;
  for (const row of rows) {
    const kind = table === "startup_posts" ? "startup" : "themed";
    const relation = kind === "startup" ? row.startups : row.themed_accounts;
    const category = relation?.category || "";
    const author = relation?.name || relation?.display_name || "";
    const content = makeRichContent({
      title: row.title,
      body: row.content || row.summary,
      category,
      author,
      kind,
    });
    const hashtags = validTags(row, category, kind);
    const image_url = clean(row.image_url) || IMAGE_POOL[hashIndex(`${table}:${row.id}:${row.title}`, IMAGE_POOL.length)];

    const { error } = await supabase
      .from(table)
      .update({
        content,
        summary: summaryFrom(content),
        hashtags,
        image_url,
      })
      .eq("id", row.id);

    if (error) {
      console.error(`[${table}] failed ${row.id}: ${error.message}`);
      continue;
    }

    updated += 1;
    console.log(`[${table}] updated ${row.id} - ${row.title || "(untitled)"}`);
  }
  return updated;
}

async function processTable(table) {
  const rows = await fetchRows(table);
  const failing = rows.filter(needsRepair);
  console.log(`${table}: ${rows.length} total, ${failing.length} need repair`);
  const updated = await updateBatch(table, failing);
  console.log(`${table}: ${updated} updated`);
}

await processTable("startup_posts");
await processTable("themed_posts");

console.log("Repair run complete. Run supabase/generated_content_repair_verify.sql next.");
