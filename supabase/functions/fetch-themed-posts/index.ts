// Generates themed account posts from RSS sources with source dedupe, topic
// relevance, rich AI rewriting, validation, hashtags, and media fallback.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { sanitizeContent, sanitizeHashtags, validateGeneratedPostContent } from "../_shared/contentSanitizer.ts";
import { requireInternalCaller } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_ORIGIN") ?? "",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? Deno.env.get("LOVABLE_API_KEY");
const AI_CHAT_COMPLETIONS_URL =
  Deno.env.get("AI_CHAT_COMPLETIONS_URL") ?? "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";
const AI_IMAGE_GENERATIONS_URL =
  Deno.env.get("AI_IMAGE_GENERATIONS_URL") ?? "https://api.openai.com/v1/images/generations";
const OPENAI_IMAGE_MODEL = Deno.env.get("OPENAI_IMAGE_MODEL") ?? "gpt-image-1";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MAX_PER_RUN = 2;
const MIN_POST_LEN = 500;

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate?: string;
  image?: string;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Astrophotography": ["nebula", "galaxy", "milky way", "moon", "stars", "astrophotography", "comet", "aurora", "telescope", "eclipse", "planet"],
  "Rocket Engineering": ["rocket", "propulsion", "launch", "engine", "thrust", "orbit", "booster", "stage", "reusable", "starship", "falcon", "new glenn", "liftoff"],
  "Space Policy and Law": ["policy", "law", "treaty", "regulation", "liability", "spectrum", "licens", "space force", "outer space treaty", "artemis accords", "fcc", "faa"],
  "Astrobiology": ["astrobiology", "life", "extremophile", "exoplanet", "habitable", "biosignature", "mars life", "europa", "enceladus", "amino"],
  "Mass Society": ["space", "education", "outreach", "stem", "community", "exploration", "public", "awareness", "culture", "art", "film"],
  "Satellite Tech": ["satellite", "earth observation", "constellation", "communication", "sar", "hyperspectral", "cubesat", "smallsat", "ground station", "downlink"],
  "Indian Space Program": ["isro", "india", "indian", "chandrayaan", "gaganyaan", "pslv", "gslv", "aditya", "nsil", "in-space", "sriharikota", "bengaluru", "antrix", "skyroot", "agnikul", "pixxel", "dhruva", "bellatrix"],
  "Deep Space Exploration": ["deep space", "probe", "interstellar", "voyager", "jupiter", "saturn", "uranus", "neptune", "pluto", "kuiper", "outer planet", "new horizons", "mission to"],
};

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

function ensureHashtagLine(body: string, tags: string[]): string {
  const cleanBody = body.replace(/(?:^|\n)#[a-zA-Z0-9_#\s]+$/g, "").trim();
  const line = sanitizeHashtags(tags).slice(0, 6).map((t) => `#${t}`).join(" ");
  return line ? `${cleanBody}\n\n${line}` : cleanBody;
}

function extractHashtags(text: string, category: string): string[] {
  const tags: string[] = [];
  for (const m of text.matchAll(/#([a-zA-Z0-9_]{2,32})/g)) tags.push(m[1].toLowerCase());
  const map: Record<string, string[]> = {
    "Astrophotography": ["astrophotography", "nightsky", "stargazing"],
    "Rocket Engineering": ["rockets", "propulsion", "launch"],
    "Space Policy and Law": ["spacepolicy", "spacelaw"],
    "Astrobiology": ["astrobiology", "exoplanets"],
    "Mass Society": ["space", "exploration"],
    "Satellite Tech": ["satellites", "earthobservation"],
    "Indian Space Program": ["isro", "india", "indianspace"],
    "Deep Space Exploration": ["deepspace", "exploration"],
  };
  for (const k of (map[category] || [])) tags.push(k);
  const lower = text.toLowerCase();
  for (const k of ["nasa", "esa", "jaxa", "spacex", "mars", "moon", "mission", "launch", "satellite", "orbit"]) {
    if (lower.includes(k)) tags.push(k);
  }
  return sanitizeHashtags(tags).slice(0, 6);
}

async function fetchRss(url: string): Promise<RssItem[]> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "GalaxyGround/1.0" } });
    if (!res.ok) return [];
    const xml = await res.text();
    const items: RssItem[] = [];
    const itemRegex = /<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/g;
    let m;
    while ((m = itemRegex.exec(xml)) && items.length < 20) {
      const block = m[2];
      const get = (tag: string) => {
        const r = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
        return r ? r[1] : "";
      };
      const link = block.match(/<link[^>]*href="([^"]+)"/i)?.[1] || get("link");
      const title = sanitizeContent(get("title"), true).cleaned;
      const desc = sanitizeContent(get("description") || get("summary") || get("content"), true).cleaned;
      const pub = get("pubDate") || get("published") || get("updated");
      const image = block.match(/<(?:media:content|enclosure)[^>]*url="([^"]+)"/i)?.[1]
        || block.match(/<img[^>]+src="([^"]+)"/i)?.[1];
      if (link && title) items.push({ title, link, description: desc.slice(0, 2500), pubDate: pub || undefined, image });
    }
    return items;
  } catch {
    return [];
  }
}

function isOnTopic(text: string, category: string): boolean {
  const kws = CATEGORY_KEYWORDS[category] || [];
  if (kws.length === 0) return true;
  const lower = text.toLowerCase();
  return kws.some((k) => lower.includes(k));
}

function buildStructuredFallback(account: any, item: RssItem, tags: string[]) {
  const clean = dedupeSentences(sanitizeContent(`${item.title}. ${item.description}`, true).cleaned);
  const sentences = clean.split(/(?<=[.!?])\s+/).filter((s) => s.length > 35);
  const context = sentences.slice(0, 6).join(" ");
  const paragraphOne = [
    `${item.title.replace(/[.!?]+$/, "")}. For followers of ${account.focus || account.category || "space exploration"}, the details make this more than a passing headline.`,
    `A new story in ${String(account.category || "space").toLowerCase()} deserves a closer reading: ${item.title.replace(/[.!?]+$/, "")}.`,
    `${account.display_name} is tracking a development that connects directly to ${account.focus || account.category || "the changing space ecosystem"}.`,
  ][stableVariant(`${account.id}:${item.title}`, 3)] + ` ${context}`;
  const paragraphTwo = [
    `What matters next is the evidence behind the announcement: mission performance, scientific results, technical readiness, or sustained operational use. Those signals will show whether the story has lasting significance.`,
    `The broader context is how quickly specialized research and engineering are becoming visible through real missions and public results. Follow-on data will be more important than the initial announcement alone.`,
    `This development also shows how one focused result can influence a wider conversation across science, engineering, policy, and commercial activity. The strongest conclusions will come from verified follow-up work.`,
  ][stableVariant(`${item.title}:meaning`, 3)];
  const paragraphThree =
    `We will keep watching for official updates, measurable outcomes, and the next milestone that adds substance to the story.`;
  return {
    content: ensureHashtagLine(`${paragraphOne}\n\n${paragraphTwo}\n\n${paragraphThree}`, tags),
    summary: sanitizeContent(item.title.slice(0, 220), true).cleaned,
  };
}

async function rewriteInVoice(account: any, item: RssItem) {
  if (!OPENAI_API_KEY) return null;
  const sys = `You are the social-media voice of "${account.display_name}" (@${account.handle}), a ${account.category} account.
Voice: ${account.voice}. Focus: ${account.focus}. Vibe: ${account.vibe}.

Rewrite the news as one complete Galaxy Ground post.
Rules:
- 150-230 words of clear, easy-to-read prose.
- 2-4 short paragraphs with a blank line between paragraphs.
- Plain text only. No links, HTML, JSON, markdown tables, or code.
- Hook the reader in the first sentence.
- Stay strictly factual to the source excerpt.
- Do not output a headline stack.
- Do not cut off mid-thought.
- End with 4-6 relevant lowercase hashtags on a new final line.
- Hashtag format: #space #nasa #mission`;

  try {
    const res = await fetch(AI_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: `Title: ${item.title}\n\nSource excerpt:\n${item.description}` },
        ],
        temperature: 0.72,
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const rawContent = String(json.choices?.[0]?.message?.content?.trim() || "");
    const content = rawContent
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<\/?[^>]+>/g, " ")
      .replace(/https?:\/\/[^\s<>"')]+/gi, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (!content || content.length < MIN_POST_LEN) return null;
    const summary = sanitizeContent(content.split(/\n/)[0].slice(0, 220), true).cleaned;
    return { content, summary };
  } catch {
    return null;
  }
}

async function validateImageUrl(url?: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!["http:", "https:"].includes(u.protocol)) return null;
  } catch {
    return null;
  }
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

async function generateImage(supabase: any, account: any, item: RssItem): Promise<string | null> {
  if (!OPENAI_API_KEY) return null;
  try {
    const prompt = `Photorealistic editorial space image for ${account.category}: ${item.title}. Cinematic, high detail, no text overlays, no logos.`;
    const res = await fetch(AI_IMAGE_GENERATIONS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: OPENAI_IMAGE_MODEL, prompt, size: "1024x1024", n: 1 }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.data?.[0]?.url) return json.data[0].url;
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) return null;
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const path = `themed/${account.handle}/${crypto.randomUUID()}.png`;
    const up = await supabase.storage.from("post-media").upload(path, bytes, { contentType: "image/png", upsert: false });
    if (up.error) {
      console.error("[image][upload_failed]", up.error);
      return null;
    }
    const { data: pub } = supabase.storage.from("post-media").getPublicUrl(path);
    return pub?.publicUrl || null;
  } catch (e) {
    console.error("[image][generation_failed]", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const caller = await requireInternalCaller(req);
  if (!caller.ok) return caller.response;

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: accounts, error } = await supabase
    .from("themed_accounts")
    .select("id, handle, display_name, category, focus, voice, vibe, rss_feeds");
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: existingImgs } = await supabase
    .from("themed_posts")
    .select("image_url")
    .not("image_url", "is", null);
  const usedImagesGlobal = new Set((existingImgs || []).map((r: any) => r.image_url));

  const { data: recentPosts } = await supabase
    .from("themed_posts")
    .select("source_url, title, summary, content")
    .order("published_at", { ascending: false })
    .limit(800);
  const recentBodies = (recentPosts || []).map((r: any) => String(r.content || r.summary || r.title || ""));
  const recentTitles = (recentPosts || []).map((r: any) => String(r.title || "")).filter(Boolean);

  const byCategory = new Map<string, any[]>();
  for (const a of accounts || []) {
    const arr = byCategory.get(a.category) || [];
    arr.push(a);
    byCategory.set(a.category, arr);
  }

  let inserted = 0;
  let skipped = 0;
  let failed = 0;
  let offTopic = 0;
  let imageGenerated = 0;
  let aiRewriteFailed = 0;
  let duplicates = 0;
  let lowQuality = 0;

  for (const [category, accs] of byCategory) {
    const accIds = accs.map((a) => a.id);
    const { data: usedRows } = await supabase
      .from("themed_posts")
      .select("source_url")
      .in("account_id", accIds);
    const usedInCategory = new Set((usedRows || []).map((r: any) => r.source_url));

    for (const acc of accs) {
      try {
        const allItems: RssItem[] = [];
        for (const feed of acc.rss_feeds || []) allItems.push(...await fetchRss(feed));
        if (allItems.length === 0) continue;

        const byLink = new Map<string, RssItem>();
        for (const it of allItems) if (!byLink.has(it.link)) byLink.set(it.link, it);

        const candidates = Array.from(byLink.values())
          .filter((c) => !usedInCategory.has(c.link))
          .filter((c) => {
            const ok = isOnTopic(`${c.title} ${c.description}`, acc.category);
            if (!ok) offTopic++;
            return ok;
          });

        const fresh = candidates.slice(0, MAX_PER_RUN);

        for (const item of fresh) {
          const rawTags = extractHashtags(`${item.title} ${item.description}`, acc.category);
          const rewritten = await rewriteInVoice(acc, item);
          if (!rewritten) aiRewriteFailed++;
          const fallback = buildStructuredFallback(acc, item, rawTags);
          const candidateContent = rewritten?.content || fallback.content;
          const summary = rewritten?.summary || fallback.summary;
          const hashtags = extractHashtags(`${item.title} ${candidateContent} ${summary}`, acc.category);
          const content = ensureHashtagLine(candidateContent, hashtags);

          const bodyTokens = tokenSet(content);
          const titleTokens = tokenSet(item.title);
          if (recentTitles.some((title) => jaccard(titleTokens, tokenSet(title)) > 0.58)) {
            duplicates++;
            console.log(`[dedupe][near-title] account=${acc.handle} source=${item.link}`);
            continue;
          }
          if (recentBodies.some((b) => jaccard(bodyTokens, tokenSet(b)) > 0.78)) {
            duplicates++;
            console.log(`[dedupe][semantic] account=${acc.handle} source=${item.link}`);
            continue;
          }

          const validation = validateGeneratedPostContent(content, hashtags, MIN_POST_LEN);
          if (!validation.ok) {
            lowQuality++;
            console.log(`[reject][validation] account=${acc.handle} reason=${validation.reason} source=${item.link}`);
            continue;
          }

          let imageUrl: string | null = null;
          const sourceImage = await validateImageUrl(item.image);
          if (sourceImage && !usedImagesGlobal.has(sourceImage)) {
            imageUrl = sourceImage;
          } else {
            const generated = await generateImage(supabase, acc, item);
            if (generated) {
              imageUrl = generated;
              imageGenerated++;
            }
          }
          if (imageUrl) usedImagesGlobal.add(imageUrl);

          const { error: insErr } = await supabase.from("themed_posts").insert({
            account_id: acc.id,
            title: item.title.slice(0, 280),
            content,
            summary,
            source_url: item.link,
            source_type: "rss",
            image_url: imageUrl,
            hashtags,
            published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          });

          if (insErr) {
            if (insErr.code === "23505") skipped++;
            else {
              failed++;
              console.error("[insert][themed_posts]", insErr.message);
            }
          } else {
            inserted++;
            usedInCategory.add(item.link);
            recentBodies.push(content);
            recentTitles.push(item.title);
            console.log(`[inserted][themed_posts] account=${acc.handle} source=${item.link} image=${!!imageUrl}`);
          }
        }
      } catch (e) {
        console.error(`account ${acc.handle} failed:`, e);
        failed++;
      }
    }
  }

  return new Response(JSON.stringify({
    inserted,
    skipped,
    failed,
    offTopic,
    imageGenerated,
    aiRewriteFailed,
    duplicates,
    lowQuality,
    accounts: accounts?.length ?? 0,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
