import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { normalizeInterests } from "@/lib/safe-data";

export type ProfileRow = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  interests: string[];
  badges: string[];
  weekly_digest_opt_in: boolean;
  created_at: string;
};

export { normalizeInterests } from "@/lib/safe-data";

export function normalizeProfile(row: Record<string, unknown>): ProfileRow {
  return {
    user_id: String(row.user_id ?? ""),
    username: (row.username as string | null) ?? null,
    display_name: (row.display_name as string | null) ?? null,
    avatar_url: (row.avatar_url as string | null) ?? null,
    bio: (row.bio as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    website: (row.website as string | null) ?? null,
    interests: normalizeInterests(row.interests),
    badges: normalizeInterests(row.badges),
    weekly_digest_opt_in: row.weekly_digest_opt_in === true,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

/** Create profile row if trigger did not run (legacy accounts). */
export async function ensureProfile(user: User): Promise<ProfileRow | null> {
  const { data: existing, error: readErr } = await supabase
    .from("profiles")
    .select("user_id, username, display_name, avatar_url, bio, location, website, interests, badges, weekly_digest_opt_in, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (readErr) throw readErr;
  if (existing) return normalizeProfile(existing as Record<string, unknown>);

  const meta = user.user_metadata ?? {};
  const username =
    (meta.username as string) || user.email?.split("@")[0] || "explorer";
  const display_name = (meta.display_name as string) || username;

  const { data: inserted, error: insertErr } = await supabase
    .from("profiles")
    .insert({ user_id: user.id, username, display_name })
    .select("user_id, username, display_name, avatar_url, bio, location, website, interests, badges, weekly_digest_opt_in, created_at")
    .single();

  if (insertErr) {
    // Race: trigger created row between read and insert
    const { data: retry } = await supabase
      .from("profiles")
      .select("user_id, username, display_name, avatar_url, bio, location, website, interests, badges, weekly_digest_opt_in, created_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (retry) return normalizeProfile(retry as Record<string, unknown>);
    throw insertErr;
  }

  return normalizeProfile(inserted as Record<string, unknown>);
}

export async function fetchFollowCounts(userId: string): Promise<{ followers: number; following: number }> {
  const [followersRes, followingRes] = await Promise.all([
    supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("target_type", "user")
      .eq("target_id", userId),
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", userId),
  ]);

  if (followersRes.error?.message?.includes("target_type")) {
    const legacy = await supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", userId);
    return {
      followers: legacy.count ?? 0,
      following: followingRes.count ?? 0,
    };
  }

  if (followersRes.error) throw followersRes.error;
  if (followingRes.error) throw followingRes.error;

  return {
    followers: followersRes.count ?? 0,
    following: followingRes.count ?? 0,
  };
}
