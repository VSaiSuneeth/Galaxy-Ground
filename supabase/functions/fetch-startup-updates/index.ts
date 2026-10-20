// Fetches startup updates from MULTIPLE sources:
//   1. Configured RSS feeds
//   2. Google News RSS for the startup name
//   3. Firecrawl map+scrape on the startup website
// Plus a `?backfill=1` mode that AI-generates 3-4 historical posts about a
// startup's past achievements/missions when no fresh content is found.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { sanitizeContent, sanitizeHashtags, validateGeneratedPostContent } from "../_shared/contentSanitizer.ts";
import { requireInternalCaller } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_ORIGIN") ?? "",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIRECRAWL_KEY = Deno.env.get("FIRECRAWL_API_KEY");
// TODO: Configure your own AI provider/gateway endpoint and key in Supabase secrets.
// Example endpoint: https://api.openai.com/v1/chat/completions
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? Deno.env.get("LOVABLE_API_KEY");
const AI_CHAT_COMPLETIONS_URL =
  Deno.env.get("AI_CHAT_COMPLETIONS_URL") ?? "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";
const AI_IMAGE_GENERATIONS_URL =
  Deno.env.get("AI_IMAGE_GENERATIONS_URL") ?? "https://api.openai.com/v1/images/generations";
const OPENAI_IMAGE_MODEL = Deno.env.get("OPENAI_IMAGE_MODEL") ?? "gpt-image-1";
const MAX_PER_STARTUP = 4;
const MIN_BODY_LEN = 520;
const MIN_SUMMARY_LEN = 120;
const MAX_SUMMARY_LEN = 300;
const MAX_IMAGE_REUSE = 2;

interface ParsedItem {
  title?: string;
  content: string;
  source_url: string;
  source_type: "rss" | "website" | "news" | "backfill";
  image_url?: string;
  published_at?: string;
}

function extractHashtags(text: string): string[] {
  const tags: string[] = [];
  for (const m of text.matchAll(/#([a-zA-Z][a-zA-Z0-9_]{1,31})/g)) {
    tags.push(m[1].toLowerCase());
  }
  const kw = ["rocket","launch","satellite","propulsion","payload","orbit","spacex","isro","mission","lander","constellation","hyperspectral","sar","earthobservation","space"];
  const lower = text.toLowerCase();
  for (const k of kw) if (lower.includes(k)) tags.push(k);
  return sanitizeHashtags(tags).slice(0, 8);
}

function hashtagLine(tags: string[]): string {
  return sanitizeHashtags(tags).slice(0, 6).map((t) => `#${t}`).join(" ");
}

function ensureHashtagLine(body: string, tags: string[]): string {
  const cleanBody = body.replace(/(?:^|\n)#[a-zA-Z0-9_#\s]+$/g, "").trim();
  const line = hashtagLine(tags);
  return line ? `${cleanBody}\n\n${line}` : cleanBody;
}

async function aiCall(system: string, user: string): Promise<string | null> {
  if (!OPENAI_API_KEY) return null;
  try {
    const res = await fetch(AI_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        temperature: 0.72,
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.choices?.[0]?.message?.content?.trim() ?? null;
  } catch { return null; }
}

async function summarize(text: string): Promise<string | null> {
  if (text.length < 400) return null;
  return aiCall(
    "Rewrite this as an engaging startup feed summary in plain text. Keep it factual, human, and concise. No markdown, no links, no source-brand boilerplate.",
    text.slice(0, 6000),
  );
}

function normalizeTitle(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenSet(s: string): Set<string> {
  return new Set(
    (s || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 3),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const v of a) if (b.has(v)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function dedupeSentences(s: string): string {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const p of s.split(/(?<=[.!?])\s+/)) {
    const n = p.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(p.trim());
  }
  return out.join(" ").trim();
}

function stableVariant(input: string, count: number): number {
  let hash = 0;
  for (const char of input) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  return Math.abs(hash) % count;
}

function cleanGeneratedTextPreserveLines(input: string): string {
  return (input || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/https?:\/\/[^\s<>"')]+/gi, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isProbablyImageUrl(url: string): boolean {
  return /(\.png|\.jpg|\.jpeg|\.webp|\.gif)(\?|$)/i.test(url) || /image|photo|media|cdn/i.test(url);
}

async function validateImageUrl(url?: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!["http:", "https:"].includes(u.protocol)) return null;
  } catch {
    return null;
  }
  if (!isProbablyImageUrl(url)) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, { method: "HEAD", signal: ctrl.signal });
    clearTimeout(t);
    const ct = res.headers.get("content-type") || "";
    if (!res.ok || !ct.startsWith("image/")) return null;
    return url;
  } catch {
    return null;
  }
}

async function rewriteForFeed(startup: any, title: string, content: string): Promise<{ body: string; summary: string } | null> {
  const system = "You are an editor for a premium space-tech startup social feed.";
  const user = `Rewrite into polished feed copy.\nRules:\n- Body: 120-190 words in 2-3 short paragraphs, engaging and factual.\n- Body must have complete sentences and useful context, not a headline stack.\n- End the body with 4-6 relevant lowercase hashtags on a new final line.\n- Summary: 120-300 chars, concise and informative.\n- Do not repeat title text verbatim.\n- No markdown except hashtags, no links, no HTML, no \"Read more\".\n- No source outlet names unless crucial context.\nOutput JSON only: {\"body\":\"...\",\"summary\":\"...\"}\n\nStartup: ${startup.name}\nCategory: ${startup.category}\nTitle: ${title}\nRaw content: ${content.slice(0, 5000)}`;
  const raw = await aiCall(system, user);
  if (!raw) return null;
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    const body = cleanGeneratedTextPreserveLines(String(parsed.body || ""));
    const summary = sanitizeContent(String(parsed.summary || ""), true).cleaned;
    if (body.length < MIN_BODY_LEN || summary.length < MIN_SUMMARY_LEN || summary.length > MAX_SUMMARY_LEN) return null;
    return { body, summary: dedupeSentences(summary) };
  } catch {
    return null;
  }
}

function buildStructuredFallback(startup: any, title: string, content: string, tags: string[]): { body: string; summary: string } {
  const clean = dedupeSentences(sanitizeContent(content, true).cleaned);
  const sentences = clean.split(/(?<=[.!?])\s+/).filter((s) => s.length > 35);
  const context = sentences.slice(0, 6).join(" ") || clean;
  const lead = [
    `${title.replace(/[.!?]+$/, "")}. The update puts ${startup.name} in focus as the company advances its work in ${startup.category || "space technology"}.`,
    `${startup.name} has a new development tied to ${startup.category || "the commercial space sector"}: ${title.replace(/[.!?]+$/, "")}.`,
    `A fresh update from ${startup.name} shows how quickly work in ${startup.category || "space technology"} is moving from plans toward real capability.`,
  ][stableVariant(`${startup.id}:${title}`, 3)];
  const paragraphOne = `${lead} ${context}`;
  const paragraphTwo = [
    `The practical significance is in the underlying capability, the partners involved, and the path from engineering work to operational use. Those details determine whether the announcement becomes a durable advantage or remains an early milestone.`,
    `Beyond the headline, the development matters because execution, technical readiness, and customer adoption will shape its real impact. The next evidence to watch will be delivery milestones, mission results, and follow-on partnerships.`,
    `For the wider space ecosystem, this is another signal that specialized infrastructure and data products are becoming central to commercial missions. Progress will ultimately be measured by deployment, reliability, and repeat demand.`,
  ][stableVariant(`${title}:context`, 3)];
  const paragraphThree =
    `Galaxy Ground will continue tracking what happens next, especially concrete mission outcomes, verified technical progress, and any new partnerships connected to this development.`;
  const body = ensureHashtagLine(`${paragraphOne}\n\n${paragraphTwo}\n\n${paragraphThree}`, tags);
  return {
    body,
    summary: sanitizeContent(`${startup.name} update: ${title}`.slice(0, 260), true).cleaned,
  };
}

async function generateImage(supabase: any, startup: any, title: string): Promise<string | null> {
  if (!OPENAI_API_KEY) return null;
  try {
    const prompt = `Photorealistic editorial image for a space technology post about ${startup.name}: ${title}. Space startup, satellite, rocket, mission control or orbital engineering context. Cinematic, high detail, no text overlays, no logos.`;
    const res = await fetch(AI_IMAGE_GENERATIONS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OPENAI_IMAGE_MODEL,
        prompt,
        size: "1024x1024",
        n: 1,
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const imageUrl = json.data?.[0]?.url;
    if (imageUrl) return imageUrl;
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) return null;
    const mime = "image/png";
    const ext = "png";
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const path = `startup/${startup.slug || startup.id}/${crypto.randomUUID()}.${ext}`;
    const up = await supabase.storage.from("post-media").upload(path, bytes, { contentType: mime, upsert: false });
    if (up.error) return null;
    const { data: pub } = supabase.storage.from("post-media").getPublicUrl(path);
    return pub?.publicUrl || null;
  } catch {
    return null;
  }
}

function titleRepetitionScore(title: string, body: string): number {
  const t = tokenSet(title);
  const b = tokenSet(body);
  return jaccard(t, b);
}

async function fetchRssGeneric(url: string): Promise<ParsedItem[]> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "GalaxyGround/1.0" } });
    if (!res.ok) return [];
    const xml = await res.text();
    const items: ParsedItem[] = [];
    const itemRegex = /<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/g;
    let m;
    while ((m = itemRegex.exec(xml)) && items.length < 8) {
      const block = m[2];
      const get = (tag: string) => {
        const r = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
        return r ? r[1] : "";
      };
      const link = block.match(/<link[^>]*href="([^"]+)"/i)?.[1] || get("link");
      const title = get("title");
      const descRaw = get("description") || get("summary") || get("content");
      const descSan = sanitizeContent(descRaw, true);
      const titleSan = sanitizeContent(title, true);
      const desc = descSan.cleaned;
      const cleanTitle = titleSan.cleaned;
      const pub = get("pubDate") || get("published") || get("updated");
      const image = block.match(/<(?:media:content|enclosure)[^>]*url="([^"]+)"/i)?.[1];
      if (link && (cleanTitle || desc)) {
        items.push({
          title: cleanTitle || undefined,
          content: desc || cleanTitle,
          source_url: link,
          source_type: "rss",
          image_url: image,
          published_at: pub ? new Date(pub).toISOString() : undefined,
        });
      }
    }
    return items;
  } catch { return []; }
}

async function fetchGoogleNews(name: string): Promise<ParsedItem[]> {
  const query = encodeURIComponent(`"${name}" space`);
  const items = await fetchRssGeneric(`https://news.google.com/rss/search?q=${query}&hl=en&gl=US&ceid=US:en`);
  return items.map((i) => ({ ...i, source_type: "news" as const })).slice(0, 4);
}

async function discoverUrls(website: string): Promise<string[]> {
  if (!FIRECRAWL_KEY) return [];
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/map", {
      method: "POST",
      headers: { Authorization: `Bearer ${FIRECRAWL_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url: website, limit: 200 }),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const links: string[] = json.links || json.data?.links || [];
    return links
      .filter((u) => /(blog|news|press|update|article|post|insight|launch|mission|announce)/i.test(u)
        && !/\.(pdf|jpg|jpeg|png|svg|webp|mp4|css|js)$/i.test(u))
      .sort((a, b) => b.split("/").length - a.split("/").length)
      .slice(0, MAX_PER_STARTUP);
  } catch { return []; }
}

async function scrapeUrl(url: string): Promise<ParsedItem | null> {
  if (!FIRECRAWL_KEY) return null;
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${FIRECRAWL_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const md = json.data?.markdown || json.markdown;
    const meta = json.data?.metadata || json.metadata || {};
    if (!md || md.length < 200) return null;
    return {
      title: meta.title || meta.ogTitle,
      content: md.slice(0, 4000),
      source_url: meta.sourceURL || url,
      source_type: "website",
      image_url: meta.ogImage,
    };
  } catch { return null; }
}

/** AI-generates ~4 unique posts about a startup's history when no real news is available. */
async function generateBackfillPosts(s: any, existingTitles: Set<string>): Promise<ParsedItem[]> {
  if (!OPENAI_API_KEY) return [];
  const sys = `Generate 4 short social posts (80-140 words each) about real, well-known achievements and milestones of the space startup "${s.name}" (${s.category}). Each post must focus on a DIFFERENT topic (e.g. founding story, key engine/tech, partnerships, past missions, awards). Plain text, factual, no markdown, no fabricated dates. End each post with 3-4 relevant hashtags on a new line. Separate posts with a line "---".`;
  const user = `Startup: ${s.name}\nCategory: ${s.category}\nDescription: ${s.description || ""}\nHQ: ${s.hq || ""}\nFounded: ${s.founded || ""}\nWebsite: ${s.website || ""}`;
  const text = await aiCall(sys, user);
  if (!text) return [];
  const blocks = text.split(/^---\s*$/m).map((b) => b.trim()).filter((b) => b.length > 50);
  const items: ParsedItem[] = [];
  for (let i = 0; i < blocks.length && items.length < MAX_PER_STARTUP; i++) {
    const block = blocks[i];
    const firstLine = block.split("\n")[0].slice(0, 120);
    if (existingTitles.has(firstLine)) continue;
    items.push({
      title: firstLine,
      content: block,
      source_url: `${s.website || "https://galaxyground.app"}#milestone-${s.id}-${i}-${Date.now()}`,
      source_type: "backfill",
      // Stagger publish dates so they don't all appear at the exact same instant
      published_at: new Date(Date.now() - i * 1000 * 60 * 60 * 6).toISOString(),
    });
  }
  return items;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const caller = await requireInternalCaller(req);
  if (!caller.ok) return caller.response;

  const url = new URL(req.url);
  const backfillMode = url.searchParams.get("backfill") === "1";
  const onlyEmpty = url.searchParams.get("onlyEmpty") === "1";

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: startups, error } = await supabase
    .from("startups")
    .select("id, name, slug, category, description, hq, founded, website, rss_feeds");
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let inserted = 0, skipped = 0, failed = 0, backfilled = 0, duplicates = 0, lowQuality = 0;
  let imageGenerated = 0, aiRewriteFailed = 0;
  const { data: existingImages } = await supabase
    .from("startup_posts")
    .select("image_url")
    .not("image_url", "is", null)
    .limit(3000);
  const imageUseCount = new Map<string, number>();
  for (const r of existingImages || []) {
    if (!r.image_url) continue;
    imageUseCount.set(r.image_url, (imageUseCount.get(r.image_url) || 0) + 1);
  }

  for (const s of startups || []) {
    try {
      // Check existing post count
      const { count: existingCount } = await supabase
        .from("startup_posts")
        .select("id", { count: "exact", head: true })
        .eq("startup_id", s.id);

      if (onlyEmpty && (existingCount || 0) > 0) continue;

      const items: ParsedItem[] = [];

      // 1) RSS feeds
      for (const feed of (s.rss_feeds || [])) items.push(...await fetchRssGeneric(feed));

      // 2) Google News
      items.push(...await fetchGoogleNews(s.name));

      // 3) Website discovery + scrape if still thin
      if (items.length < MAX_PER_STARTUP && s.website) {
        const candidates = await discoverUrls(s.website);
        const { data: existing } = await supabase
          .from("startup_posts").select("source_url").eq("startup_id", s.id).in("source_url", candidates);
        const seen = new Set((existing || []).map((r) => r.source_url));
        const fresh = candidates.filter((u) => !seen.has(u)).slice(0, MAX_PER_STARTUP - items.length);
        for (const u of fresh) {
          const item = await scrapeUrl(u);
          if (item) items.push(item);
        }
      }

      // Filter out URLs we already have for this startup
      const candidateUrls = items.map((i) => i.source_url);
      const { data: dupCheck } = candidateUrls.length
        ? await supabase.from("startup_posts").select("source_url, title, summary, content").in("source_url", candidateUrls)
        : { data: [] as any[] };
      const dupSet = new Set((dupCheck || []).map((r: any) => r.source_url));
      const { data: recentPosts } = await supabase
        .from("startup_posts")
        .select("title, summary, content")
        .order("published_at", { ascending: false })
        .limit(500);
      const existingTitleNorms = new Set(
        ([...(dupCheck || []), ...(recentPosts || [])])
          .map((r: any) => normalizeTitle(r.title || ""))
          .filter(Boolean),
      );
      const existingTitles = ([...(dupCheck || []), ...(recentPosts || [])])
        .map((r: any) => String(r.title || ""))
        .filter(Boolean);
      const existingBodies = ([...(dupCheck || []), ...(recentPosts || [])]).map((r: any) => String(r.summary || r.content || ""));
      const acceptedBodiesThisRun: string[] = [];
      const acceptedTitlesThisRun: string[] = [];
      const fresh = items.filter((i) => !dupSet.has(i.source_url)).slice(0, MAX_PER_STARTUP * 2);

      // 4) Backfill if still empty (or backfillMode requested)
      const totalAfter = (existingCount || 0) + fresh.length;
      if ((backfillMode || totalAfter < 3) && fresh.length < MAX_PER_STARTUP) {
        const { data: existingPosts } = await supabase
          .from("startup_posts").select("title").eq("startup_id", s.id);
        const titles = new Set((existingPosts || []).map((p: any) => p.title || ""));
        const bf = await generateBackfillPosts(s, titles);
        fresh.push(...bf.slice(0, MAX_PER_STARTUP - fresh.length));
        backfilled += bf.length;
      }

      let insertedForStartup = 0;
      for (const item of fresh) {
        // Validate: must have meaningful content (≥80 chars), no obvious code/HTML errors
        const rawTitle = item.title || "";
        const rawContent = item.content || "";
        const cleanTitleSan = sanitizeContent(rawTitle, true);
        const cleanContentSan = sanitizeContent(rawContent, true);
        const cleanContent = cleanContentSan.cleaned;
        const cleanTitle = cleanTitleSan.cleaned;

        console.log(
          `[sanitize][startup_posts] startup=${s.slug} source=${item.source_type} ` +
          `title_len=${cleanTitleSan.originalLength}->${cleanTitleSan.cleanedLength} ` +
          `content_len=${cleanContentSan.originalLength}->${cleanContentSan.cleanedLength} ` +
          `html_removed=${cleanTitleSan.htmlTagsRemoved || cleanContentSan.htmlTagsRemoved}`,
        );

        if (cleanContent.length < 80) { skipped++; continue; }
        if (/^\s*[{<\[]/.test(cleanContent) && /[}\]>]\s*$/.test(cleanContent)) { skipped++; continue; }
        if (/error|undefined|null|\bNaN\b/i.test(cleanContent.slice(0, 60)) && cleanContent.length < 200) { skipped++; continue; }

        const normalizedTitle = normalizeTitle(cleanTitle);
        if (normalizedTitle && existingTitleNorms.has(normalizedTitle)) {
          duplicates++;
          console.log(`[dedupe][title] skip startup=${s.slug} title="${cleanTitle.slice(0, 90)}"`);
          continue;
        }

        const titleTokens = tokenSet(cleanTitle);
        const nearDuplicateTitle = existingTitles.some((value) => jaccard(titleTokens, tokenSet(value)) > 0.58)
          || acceptedTitlesThisRun.some((value) => jaccard(titleTokens, tokenSet(value)) > 0.58);
        if (nearDuplicateTitle) {
          duplicates++;
          console.log(`[dedupe][near-title] skip startup=${s.slug} title="${cleanTitle.slice(0, 90)}"`);
          continue;
        }

        const bodyTokens = tokenSet(cleanContent);
        const tooSimilarToExisting = existingBodies.some((b: string) => jaccard(bodyTokens, tokenSet(b)) > 0.78);
        const tooSimilarToCurrent = acceptedBodiesThisRun.some((b) => jaccard(bodyTokens, tokenSet(b)) > 0.78);
        if (tooSimilarToExisting || tooSimilarToCurrent) {
          duplicates++;
          console.log(`[dedupe][semantic] skip startup=${s.slug} source=${item.source_type}`);
          continue;
        }

        // Rewrite with AI for polished feed quality. Fallback keeps structure but still passes validation.
        const rewritten = await rewriteForFeed(s, cleanTitle, cleanContent);
        if (!rewritten) aiRewriteFailed++;
        const fallbackSummaryRaw = await summarize(cleanContent);
        const fallbackSummary = sanitizeContent(fallbackSummaryRaw || cleanContent.slice(0, 280), true).cleaned;
        const earlyTags = extractHashtags(`${cleanTitle} ${cleanContent} ${fallbackSummary}`);
        const fallback = buildStructuredFallback(s, cleanTitle, cleanContent, earlyTags);
        const body = rewritten?.body || fallback.body;
        const summary = rewritten?.summary || fallbackSummary || fallback.summary;

        const repetition = titleRepetitionScore(cleanTitle, body);
        const summaryQuality = summary.length >= MIN_SUMMARY_LEN && summary.length <= MAX_SUMMARY_LEN;
        const bodyQuality = body.length >= MIN_BODY_LEN && repetition <= 0.85;
        let qualityScore = 0;
        if (bodyQuality) qualityScore += 0.45;
        if (summaryQuality) qualityScore += 0.35;
        if (repetition <= 0.6) qualityScore += 0.2;

        let finalImageUrl = await validateImageUrl(item.image_url);
        if (finalImageUrl && (imageUseCount.get(finalImageUrl) || 0) > MAX_IMAGE_REUSE) {
          console.log(`[image][reuse] drop startup=${s.slug} image_reuse=${imageUseCount.get(finalImageUrl)} url=${finalImageUrl}`);
          finalImageUrl = null;
        }

        console.log(
          `[quality][startup_posts] startup=${s.slug} score=${qualityScore.toFixed(2)} ` +
          `summary_len=${summary.length} body_len=${body.length} title_body_sim=${repetition.toFixed(2)} ` +
          `ai_rewrite=${!!rewritten} image_ok=${!!finalImageUrl}`,
        );

        if (qualityScore < 0.6) {
          lowQuality++;
          console.log(`[reject][quality] startup=${s.slug} source=${item.source_type}`);
          continue;
        }

        const hashtags = extractHashtags(`${cleanTitle} ${body} ${summary}`);
        const finalBody = ensureHashtagLine(body, hashtags);
        const validation = validateGeneratedPostContent(finalBody, hashtags, MIN_BODY_LEN);
        if (!validation.ok) {
          lowQuality++;
          console.log(`[reject][validation] startup=${s.slug} source=${item.source_type} reason=${validation.reason}`);
          continue;
        }
        if (!finalImageUrl) {
          finalImageUrl = await generateImage(supabase, s, cleanTitle || summary);
          if (finalImageUrl) imageGenerated++;
        }
        const { error: insErr } = await supabase.from("startup_posts").insert({
          startup_id: s.id,
          title: cleanTitle.slice(0, 280) || null,
          content: finalBody,
          summary,
          source_url: item.source_url,
          source_type: item.source_type,
          image_url: finalImageUrl,
          hashtags,
          published_at: item.published_at || new Date().toISOString(),
        });
        if (insErr) {
          if (insErr.code === "23505") skipped++; else { failed++; console.error("insert", insErr.message); }
        } else {
          inserted++;
          insertedForStartup++;
          acceptedBodiesThisRun.push(body);
          acceptedTitlesThisRun.push(cleanTitle);
          existingTitles.push(cleanTitle);
          if (normalizedTitle) existingTitleNorms.add(normalizedTitle);
          if (finalImageUrl) imageUseCount.set(finalImageUrl, (imageUseCount.get(finalImageUrl) || 0) + 1);
        }
        if (insertedForStartup >= MAX_PER_STARTUP) break;
      }
    } catch (e) {
      console.error(`startup ${s.name} failed:`, e);
      failed++;
    }
  }

  return new Response(JSON.stringify({
    inserted,
    skipped,
    failed,
    backfilled,
    duplicates,
    lowQuality,
    imageGenerated,
    aiRewriteFailed,
    startups: startups?.length ?? 0,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
