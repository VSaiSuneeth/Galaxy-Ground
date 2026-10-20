// Syncs space topic content from an external API into Supabase.
// Intended to be invoked on a schedule (e.g. daily) so topic cards in the
// Explore section always have fresh facts, timeline events, and research items.
//
// TODO: Confirm external API endpoint, authentication scheme, and response
// shape before removing this notice.
//
// After the external API contract is known:
//   1. Replace fetchExternalTopicContent() with the real HTTP call.
//   2. Adjust mapApiTopicToDbRow(), mapApiFacts(), mapApiTimeline(), etc.
//      to match the response structure.
//   3. Set TOPICS_API_URL and TOPICS_API_KEY secrets.
//
// Deployment:
//   npx supabase functions deploy sync-topic-content --no-verify-jwt
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { requireInternalCaller } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_ORIGIN") ?? "",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// Configuration (set via supabase secrets)
// ---------------------------------------------------------------------------
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// TODO: Set these secrets once the external API endpoint is confirmed.
//   supabase secrets set TOPICS_API_URL=https://...
//   supabase secrets set TOPICS_API_KEY=...
const TOPICS_API_URL = Deno.env.get("TOPICS_API_URL") ?? "";
const TOPICS_API_KEY = Deno.env.get("TOPICS_API_KEY") ?? "";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ExternalTopic {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  hero_image: string;
  description: string;
  canonical_summary: string;
  freshness_label: string;
  source_class_label: string;
  hashtags: string[];
  facts: Array<{ label: string; value: string; sort_order: number }>;
  timeline: Array<{ title: string; sort_order: number }>;
  research: Array<{ title: string; sort_order: number }>;
  discoveries: Array<{ title: string; sort_order: number }>;
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------
async function fetchExternalTopicContent(): Promise<ExternalTopic[]> {
  // TODO: Replace this stub with the real HTTP call once the API is confirmed.
  // Example:
  //   const res = await fetch(TOPICS_API_URL, {
  //     headers: { Authorization: `Bearer ${TOPICS_API_KEY}` },
  //   });
  //   if (!res.ok) throw new Error(`Topics API returned ${res.status}`);
  //   return await res.json();
  console.warn("[sync-topic-content] No external API configured — returning empty set.");
  return [];
}

// ---------------------------------------------------------------------------
// Transform
// ---------------------------------------------------------------------------
interface TopicRow {
  slug: string;
  title: string;
  subtitle: string | null;
  category: string | null;
  hero_image: string | null;
  description: string | null;
  canonical_summary: string | null;
  freshness_label: string | null;
  source_class_label: string | null;
  hashtags: string[];
}

function mapApiTopicToTopicRow(api: ExternalTopic): TopicRow {
  return {
    slug: api.slug,
    title: api.title,
    subtitle: api.subtitle || null,
    category: api.category || null,
    hero_image: api.hero_image || null,
    description: api.description || null,
    canonical_summary: api.canonical_summary || null,
    freshness_label: api.freshness_label || null,
    source_class_label: api.source_class_label || null,
    hashtags: Array.isArray(api.hashtags) ? api.hashtags : [],
  };
}

// ---------------------------------------------------------------------------
// Validate
// ---------------------------------------------------------------------------
function isValidTopic(row: TopicRow): boolean {
  if (!row.title || !row.slug) return false;
  if (row.title.length < 2 || row.slug.length < 2) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Upsert helpers
// ---------------------------------------------------------------------------
async function upsertTopic(
  supabase: ReturnType<typeof createClient>,
  row: TopicRow,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("topics")
    .upsert(row, { onConflict: "slug", ignoreDuplicates: false })
    .select("id")
    .single();

  if (error) {
    console.error(`[sync-topic-content] upsert topic failed for slug=${row.slug}:`, error.message);
    return null;
  }
  return data?.id ?? null;
}

async function replaceRelated(
  supabase: ReturnType<typeof createClient>,
  table: string,
  topicIdColumn: string,
  topicId: string,
  rows: Array<Record<string, unknown>>,
): Promise<number> {
  // Delete old rows for this topic, then insert new ones.
  const { error: delErr } = await supabase
    .from(table)
    .delete()
    .eq(topicIdColumn, topicId);

  if (delErr) {
    console.error(`[sync-topic-content] delete from ${table} failed:`, delErr.message);
    return 0;
  }

  if (rows.length === 0) return 0;

  const enriched = rows.map((r) => ({ ...r, [topicIdColumn]: topicId }));
  const { error: insErr } = await supabase.from(table).insert(enriched);

  if (insErr) {
    console.error(`[sync-topic-content] insert into ${table} failed:`, insErr.message);
    return 0;
  }
  return rows.length;
}

// ---------------------------------------------------------------------------
// NASA APOD caching (run on every sync to keep the daily image fresh)
// ---------------------------------------------------------------------------
const NASA_API_KEY = Deno.env.get("NASA_API_KEY") ?? "";

interface ApodResponse {
  date: string;
  title: string;
  explanation: string;
  url: string;
  thumbnail_url?: string;
  media_type: string;
}

async function fetchAndCacheApod(supabase: ReturnType<typeof createClient>): Promise<boolean> {
  if (!NASA_API_KEY) {
    console.warn("[sync-topic-content] NASA_API_KEY not set — skipping APOD cache.");
    return false;
  }
  try {
    const res = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`,
    );
    if (!res.ok) {
      console.error(`[sync-topic-content] APOD API returned ${res.status}`);
      return false;
    }
    const apod: ApodResponse = await res.json();
    if (!apod.url || !apod.title) return false;

    const { error } = await supabase.from("apod_cache").upsert(
      {
        id: 1,
        title: apod.title,
        explanation: apod.explanation,
        url: apod.url,
        thumbnail_url: apod.thumbnail_url || null,
        date: apod.date,
        cached_at: new Date().toISOString(),
      },
      { onConflict: "id", ignoreDuplicates: false },
    );
    if (error) {
      console.error("[sync-topic-content] APOD upsert failed:", error.message);
      return false;
    }
    console.log(`[sync-topic-content] APOD cached: ${apod.title} (${apod.date})`);
    return true;
  } catch (err) {
    console.error("[sync-topic-content] APOD fetch failed:", (err as Error).message);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const caller = await requireInternalCaller(req);
  if (!caller.ok) return caller.response;

  if (!TOPICS_API_URL && !Deno.env.get("NASA_API_KEY")) {
    return new Response(JSON.stringify({ status: "not_configured", error: "TOPICS_API_URL or NASA_API_KEY is required" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1. Fetch topics
    const external = await fetchExternalTopicContent();
    console.log(`[sync-topic-content] fetched ${external.length} topics from external API`);

    let topicUpserted = 0;
    let factsInserted = 0;
    let timelineInserted = 0;
    let researchInserted = 0;
    let discoveriesInserted = 0;
    let failed = 0;

    for (const api of external) {
      const row = mapApiTopicToTopicRow(api);
      if (!isValidTopic(row)) {
        failed++;
        continue;
      }

      const topicId = await upsertTopic(supabase, row);
      if (!topicId) {
        failed++;
        continue;
      }
      topicUpserted++;

      const f = api.facts || [];
      const t = api.timeline || [];
      const r = api.research || [];
      const d = api.discoveries || [];

      factsInserted += await replaceRelated(supabase, "topic_facts", "topic_id", topicId, f);
      timelineInserted += await replaceRelated(supabase, "topic_timeline_events", "topic_id", topicId, t);
      researchInserted += await replaceRelated(supabase, "topic_sections", "topic_id", topicId, r.map((item) => ({ ...item, section_type: "research" })));
      discoveriesInserted += await replaceRelated(supabase, "topic_discoveries", "topic_id", topicId, d);
    }

    // 2. Cache NASA APOD
    const apodCached = await fetchAndCacheApod(supabase);

    return new Response(
      JSON.stringify({
        topics: topicUpserted,
        facts: factsInserted,
        timeline: timelineInserted,
        research: researchInserted,
        discoveries: discoveriesInserted,
        failed,
        apodCached,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[sync-topic-content] fatal:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
