// OrbitalStack API Gateway - public REST API for Galaxy Ground data.
//
// Routes:
//   GET /v1/launches?page=&page_size=&status=&provider=
//
// Deploy:
//   supabase functions deploy api-gateway --no-verify-jwt
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function sha256(message: string): Promise<string> {
  const enc = new TextEncoder().encode(message);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  const hex: string[] = [];
  for (const b of new Uint8Array(buf)) hex.push(b.toString(16).padStart(2, "0"));
  return hex.join("");
}

async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  keyHash: string,
): Promise<{ ok: boolean; retryAfter?: number }> {
  const now = new Date();
  const oneMinAgo = new Date(now.getTime() - 60_000).toISOString();
  const oneDayAgo = new Date(now.getTime() - 86_400_000).toISOString();

  const { count: minuteCount } = await supabase
    .from("api_usage_log")
    .select("id", { count: "exact", head: true })
    .eq("api_key_hash", keyHash)
    .gte("created_at", oneMinAgo);

  if ((minuteCount ?? 0) >= 10) return { ok: false, retryAfter: 60 };

  const { count: dayCount } = await supabase
    .from("api_usage_log")
    .select("id", { count: "exact", head: true })
    .eq("api_key_hash", keyHash)
    .gte("created_at", oneDayAgo);

  if ((dayCount ?? 0) >= 100) return { ok: false, retryAfter: 60 };

  return { ok: true };
}

async function logUsage(
  supabase: ReturnType<typeof createClient>,
  keyHash: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs: number,
): Promise<void> {
  await supabase.from("api_usage_log").insert({
    api_key_hash: keyHash,
    endpoint,
    method,
    status_code: statusCode,
    response_time_ms: responseTimeMs,
  }).catch(() => {});

  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("key_hash", keyHash)
    .catch(() => {});
}

async function handleLaunches(
  supabase: ReturnType<typeof createClient>,
  url: URL,
): Promise<{ body: unknown; status: number }> {
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("page_size") ?? "20", 10)));
  const status = url.searchParams.get("status");
  const provider = url.searchParams.get("provider");

  let q = supabase
    .from("launches")
    .select(
      "id, slug, name, provider, mission_type, launch_date, launch_window_start, launch_window_end, location, vehicle, payload, status, description, image_url, livestream_url",
      { count: "exact" },
    )
    .order("launch_date", { ascending: false });

  if (status) q = q.eq("status", status);
  if (provider) q = q.ilike("provider", `%${provider}%`);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  q = q.range(from, to);

  const { data, error, count } = await q;
  if (error) return { body: { error: error.message }, status: 500 };

  return {
    body: {
      data: data || [],
      meta: {
        count: count ?? 0,
        page,
        page_size: pageSize,
        source: "galaxy_ground_v1",
        last_synced: new Date().toISOString(),
      },
    },
    status: 200,
  };
}

async function route(
  supabase: ReturnType<typeof createClient>,
  method: string,
  pathname: string,
  url: URL,
): Promise<{ body: unknown; status: number }> {
  const normalizedPath = pathname.replace(/^\/api-gateway/, "") || "/";

  switch (normalizedPath) {
    case "/v1/launches":
      if (method !== "GET") return { body: { error: "Method not allowed" }, status: 405 };
      return handleLaunches(supabase, url);
    default:
      return { body: { error: "Not found" }, status: 404 };
  }
}

Deno.serve(async (req) => {
  const start = performance.now();
  const url = new URL(req.url);

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = req.headers.get("X-API-Key");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Invalid API key" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const keyHash = await sha256(apiKey);

    const { data: keyRow } = await supabase
      .from("api_keys")
      .select("id, tier")
      .eq("key_hash", keyHash)
      .eq("is_active", true)
      .maybeSingle();

    if (!keyRow) {
      return new Response(JSON.stringify({ error: "Invalid API key" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rateCheck = await checkRateLimit(supabase, keyHash);
    if (!rateCheck.ok) {
      const ms = performance.now() - start;
      logUsage(supabase, keyHash, url.pathname, req.method, 429, Math.round(ms));
      return new Response(JSON.stringify({ error: "Rate limit exceeded", retry_after: 60 }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
      });
    }

    const { body, status } = await route(supabase, req.method, url.pathname, url);
    const ms = Math.round(performance.now() - start);
    logUsage(supabase, keyHash, url.pathname, req.method, status, ms);

    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[api-gateway]", (e as Error).message);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
