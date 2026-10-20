export interface SanitizeResult {
  cleaned: string;
  urls: string[];
  originalLength: number;
  cleanedLength: number;
  htmlTagsRemoved: boolean;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => {
      const cp = Number(n);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : "";
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => {
      const cp = parseInt(h, 16);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : "";
    });
}

function stripHtmlTags(input: string): string {
  return input
    .replace(/<!\[CDATA\[|\]\]>/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/?[^>]+>/g, " ");
}

export function sanitizeContent(input: string, removeUrls = true): SanitizeResult {
  const original = input || "";
  const decoded = decodeHtmlEntities(original);
  const hadHtml = /<[^>]+>/.test(decoded) || /&(?:lt|gt|amp|quot|nbsp|#39);/i.test(original);

  const urls = Array.from(new Set((decoded.match(/https?:\/\/[^\s<>"')]+/gi) || [])));

  let cleaned = stripHtmlTags(decoded)
    // Remove leftover HTML-ish attribute fragments from malformed RSS anchors
    .replace(/\b(?:href|target|rel|class|style)\s*=\s*["'][^"']*["']/gi, " ")
    .replace(/\bRead more\b/gi, " ")
    .replace(/\s*·\s*news\b/gi, " ")
    .replace(/<[^>]*$/g, " ")
    .replace(/&[a-zA-Z0-9#]+;?/g, " ");

  if (removeUrls) {
    cleaned = cleaned.replace(/https?:\/\/[^\s<>"')]+/gi, " ");
  } else {
    // Deduplicate repeated URLs inline if caller wants to keep them.
    const seen = new Set<string>();
    cleaned = cleaned.replace(/https?:\/\/[^\s<>"')]+/gi, (url) => {
      if (seen.has(url)) return " ";
      seen.add(url);
      return url;
    });
  }

  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return {
    cleaned,
    urls,
    originalLength: original.length,
    cleanedLength: cleaned.length,
    htmlTagsRemoved: hadHtml,
  };
}

export function sanitizeHashtags(hashtags: string[]): string[] {
  const out = new Set<string>();
  for (const raw of hashtags || []) {
    const tag = raw.replace(/^#/, "").toLowerCase().trim();
    if (!tag) continue;
    if (!/^[a-z][a-z0-9_]{1,31}$/.test(tag)) continue;
    // Drop hex color artifacts, e.g. 6f6f6f
    if (/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(tag)) continue;
    out.add(tag);
  }
  return Array.from(out);
}

export interface GeneratedPostValidation {
  ok: boolean;
  reason?: string;
}

export function hasVisibleHashtagLine(content: string): boolean {
  const lines = (content || "").trim().split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const last = lines[lines.length - 1] || "";
  return /^#[a-z][a-z0-9_]{1,31}(?:\s+#[a-z][a-z0-9_]{1,31}){2,8}$/i.test(last);
}

export function validateGeneratedPostContent(content: string, hashtags: string[], minLength = 500): GeneratedPostValidation {
  const text = (content || "").trim();
  const cleanTags = sanitizeHashtags(hashtags);

  if (text.length < minLength) return { ok: false, reason: "too_short" };
  if (cleanTags.length < 3) return { ok: false, reason: "missing_hashtags" };
  if (!hasVisibleHashtagLine(text)) return { ok: false, reason: "missing_visible_hashtag_line" };
  if (/^\s*[{[][\s\S]*[}\]]\s*$/.test(text)) return { ok: false, reason: "raw_json" };
  if (/<\/?[a-z][\s\S]*>/i.test(text)) return { ok: false, reason: "html_or_code" };
  if (/```|function\s+\w+\s*\(|const\s+\w+\s*=|=>\s*{|SELECT\s+\*|INSERT\s+INTO/i.test(text)) {
    return { ok: false, reason: "code_fragment" };
  }
  if (/\b(undefined|null|NaN|Error:|Exception:)\b/i.test(text.slice(0, 220))) {
    return { ok: false, reason: "runtime_artifact" };
  }

  const withoutTags = text.replace(/(?:^|\n)#[a-zA-Z0-9_#\s]+$/g, "").trim();
  const sentences = withoutTags.match(/[.!?](?=\s|$)/g)?.length ?? 0;
  if (sentences < 4) return { ok: false, reason: "not_enough_sentences" };
  if (!/[.!?]\s*$/.test(withoutTags)) return { ok: false, reason: "incomplete_sentence" };

  const lines = withoutTags.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (lines.length <= 2 && lines.every((line) => line.length < 140)) {
    return { ok: false, reason: "headline_stack" };
  }

  return { ok: true };
}
