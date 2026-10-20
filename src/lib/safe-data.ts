import type { FeedPost } from "@/types/feed";

/** Coerce any value to a safe array (never undefined). */
export function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  console.warn("[Galaxy Ground] Expected array, got:", typeof value, value);
  return [];
}

/** Safe .length for arrays and strings. */
export function safeLength(value: unknown): number {
  if (Array.isArray(value) || typeof value === "string") return value.length;
  return 0;
}

export function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value == null) return fallback;
  return String(value);
}

export function normalizeHashtags(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((x): x is string => typeof x === "string");
  return [];
}

export function normalizeInterests(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((x): x is string => typeof x === "string");
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

import { captureException } from "@/lib/sentry";

/** Unified error reporter — delegates to the Sentry wrapper. */
export function reportError(error: unknown, context: string): void {
  captureException(error, context);
}

export function logDataIssue(context: string, payload?: unknown) {
  reportError(payload ?? context, context);
}

export function normalizeMediaUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const url = value.trim();
  if (!url) return null;
  if (url.startsWith("blob:") || url.startsWith("data:image/") || url.startsWith("data:video/")) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:") return url;
    if (parsed.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname)) return url;
  } catch {
    return null;
  }
  return null;
}

/** Normalize react-query data to a safe array for rendering. */
export function queryList<T>(data: T[] | undefined | null): T[] {
  return asArray(data);
}

/** Normalize a feed post so renders never hit undefined fields. */
export function normalizeFeedPost(raw: Partial<FeedPost> & Record<string, unknown>): FeedPost {
  const mediaType = raw.media_type;
  const mediaUrl = normalizeMediaUrl(raw.media_url);
  return {
    id: safeString(raw.id, "unknown"),
    user_id: safeString(raw.user_id),
    content: safeString(raw.content),
    media_url: mediaUrl,
    media_type: mediaUrl && mediaType === "video" ? "video" : mediaUrl && mediaType === "image" ? "image" : null,
    community: (raw.community as string | null) ?? null,
    hashtags: normalizeHashtags(raw.hashtags),
    created_at: safeString(raw.created_at) || new Date().toISOString(),
    author: (raw.author as FeedPost["author"]) ?? null,
    likes_count: Number(raw.likes_count) || 0,
    comments_count: Number(raw.comments_count) || 0,
    user_has_liked: typeof raw.user_has_liked === "boolean" ? raw.user_has_liked : undefined,
    user_has_bookmarked: typeof raw.user_has_bookmarked === "boolean" ? raw.user_has_bookmarked : undefined,
    reaction_type: typeof raw.reaction_type === "string" || raw.reaction_type == null ? (raw.reaction_type as string | null) : null,
    reaction_summary: Array.isArray(raw.reaction_summary)
      ? (raw.reaction_summary as Array<{ reaction_type: string; count: number }>).filter((entry) => entry && typeof entry.reaction_type === "string" && typeof entry.count === "number")
      : [],
    source: raw.source as FeedPost["source"],
    target_id: raw.target_id as string | undefined,
    startup_slug: raw.startup_slug as string | undefined,
    themed_handle: raw.themed_handle as string | undefined,
    source_url: raw.source_url as string | undefined,
    startup_id: raw.startup_id as string | undefined,
    account_id: raw.account_id as string | undefined,
  };
}

export function normalizeFeedPosts(raw: unknown): FeedPost[] {
  return asArray<Partial<FeedPost>>(raw).map((p) => normalizeFeedPost(p as FeedPost & Record<string, unknown>));
}

/** Flatten react-query infinite pages into normalized posts. */
export function flattenPostPages(pages: unknown): FeedPost[] {
  if (!pages) return [];
  if (!Array.isArray(pages)) {
    logDataIssue("flattenPostPages: pages not array", pages);
    return [];
  }
  const flat: unknown[] = [];
  for (const page of pages) {
    if (Array.isArray(page)) flat.push(...page);
    else if (page != null) logDataIssue("flattenPostPages: invalid page", page);
  }
  return normalizeFeedPosts(flat);
}
