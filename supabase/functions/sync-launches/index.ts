// Syncs upcoming launch data from an external API into Supabase.
// Intended to be invoked on a schedule (e.g. every 6 hours) via cron or
// pg_cron to keep the launches table up-to-date.
//
// TODO: Confirm external API endpoint, authentication scheme, and response
// shape before removing this notice.  The fetch + transform + upsert pipeline
// below is structurally complete but the actual API call must be filled in.
//
// After the external API contract is known:
//   1. Replace fetchExternalLaunches() with the real HTTP call.
//   2. Adjust mapApiLaunchToDbRow() to match the response fields.
//   3. Set the LAUNCHES_API_URL and LAUNCHES_API_KEY secrets.
//
// Deployment:
//   npx supabase functions deploy sync-launches --no-verify-jwt
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
//   supabase secrets set LAUNCHES_API_URL=https://...
//   supabase secrets set LAUNCHES_API_KEY=...
const LAUNCHES_API_URL = Deno.env.get("LAUNCHES_API_URL") ?? "";
const LAUNCHES_API_KEY = Deno.env.get("LAUNCHES_API_KEY") ?? "";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ExternalLaunch {
  // TODO: Fill in real fields once the external API response is known.
  id: string;
  name: string;
  provider: string;
  vehicle: string | null;
  launch_date: string;
  location: string | null;
  payload: string | null;
  status: string;
  description: string | null;
  livestream_url: string | null;
  image_url: string | null;
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------
async function fetchExternalLaunches(): Promise<ExternalLaunch[]> {
  // TODO: Replace this stub with the real HTTP call once the API is confirmed.
  // Example:
  //   const res = await fetch(LAUNCHES_API_URL, {
  //     headers: { Authorization: `Bearer ${LAUNCHES_API_KEY}` },
  //   });
  //   if (!res.ok) throw new Error(`Launch API returned ${res.status}`);
  //   return await res.json();
  console.warn("[sync-launches] No external API configured — returning empty set.");
  return [];
}

// ---------------------------------------------------------------------------
// Transform
// ---------------------------------------------------------------------------
interface DbLaunchRow {
  slug: string;
  name: string;
  provider: string;
  vehicle: string | null;
  launch_date: string;
  location: string | null;
  payload: string | null;
  status: string;
  description: string | null;
  livestream_url: string | null;
  image_url: string | null;
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function mapApiLaunchToDbRow(api: ExternalLaunch): DbLaunchRow {
  // TODO: Adjust field mapping once the external API response shape is known.
  return {
    slug: toSlug(api.name),
    name: api.name,
    provider: api.provider,
    vehicle: api.vehicle,
    launch_date: api.launch_date,
    location: api.location,
    payload: api.payload,
    status: api.status,
    description: api.description,
    livestream_url: api.livestream_url,
    image_url: api.image_url,
  };
}

// ---------------------------------------------------------------------------
// Validate
// ---------------------------------------------------------------------------
function isValidLaunch(row: DbLaunchRow): boolean {
  if (!row.name || !row.slug || !row.launch_date) return false;
  if (row.name.length < 2 || row.slug.length < 2) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Upsert
// ---------------------------------------------------------------------------
async function upsertLaunches(supabase: ReturnType<typeof createClient>, rows: DbLaunchRow[]): Promise<number> {
  let count = 0;
  for (const row of rows) {
    if (!isValidLaunch(row)) continue;
    const { error } = await supabase.from("launches").upsert(row, {
      onConflict: "slug",
      ignoreDuplicates: false,
    });
    if (error) {
      console.error(`[sync-launches] upsert failed for slug=${row.slug}:`, error.message);
    } else {
      count++;
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const caller = await requireInternalCaller(req);
  if (!caller.ok) return caller.response;

  if (!LAUNCHES_API_URL) {
    return new Response(JSON.stringify({ status: "not_configured", error: "LAUNCHES_API_URL is not configured" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1. Fetch
    const external = await fetchExternalLaunches();
    console.log(`[sync-launches] fetched ${external.length} launches from external API`);

    // 2. Transform
    const rows = external.map(mapApiLaunchToDbRow);

    // 3. Validate
    const valid = rows.filter(isValidLaunch);
    console.log(`[sync-launches] ${valid.length}/${rows.length} passed validation`);

    // 4. Upsert
    const upserted = await upsertLaunches(supabase, valid);

    return new Response(
      JSON.stringify({
        fetched: external.length,
        valid: valid.length,
        upserted,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[sync-launches] fatal:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
