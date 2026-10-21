import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ensureProfile,
  fetchFollowCounts,
  normalizeProfile,
  type ProfileRow,
} from "@/lib/profile-utils";
import type { User } from "@supabase/supabase-js";
import { logDataIssue } from "@/lib/safe-data";
import { QUERY_DEFAULTS } from "@/lib/query-config";

export function useProfileByUserId(userId?: string) {
  return useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    retry: 1,
    ...QUERY_DEFAULTS,
    queryFn: async (): Promise<ProfileRow | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url, bio, location, website, interests, badges, weekly_digest_opt_in, created_at")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) {
        logDataIssue("useProfileByUserId query failed", { userId, error });
        throw error;
      }
      if (!data) return null;
      return normalizeProfile(data as Record<string, unknown>);
    },
  });
}

export function useOwnProfile(user: User | null | undefined) {
  return useQuery({
    queryKey: ["own-profile", user?.id],
    enabled: !!user,
    retry: 1,
    ...QUERY_DEFAULTS,
    queryFn: async (): Promise<ProfileRow> => {
      const row = await ensureProfile(user!);
      if (!row) throw new Error("Could not load your profile.");
      return row;
    },
  });
}

export function useProfileStats(userId?: string) {
  return useQuery({
    queryKey: ["profile-stats", userId],
    enabled: !!userId,
    ...QUERY_DEFAULTS,
    queryFn: () => fetchFollowCounts(userId!),
  });
}

export function useIsFollowingUser(targetUserId?: string, viewerId?: string) {
  return useQuery({
    queryKey: ["is-following-user", viewerId, targetUserId],
    enabled: !!viewerId && !!targetUserId && viewerId !== targetUserId,
    ...QUERY_DEFAULTS,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", viewerId!)
        .eq("target_type", "user")
        .eq("target_id", targetUserId!)
        .maybeSingle();
      if (error?.message?.includes("target_type")) {
        const legacy = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", viewerId!)
          .eq("following_id", targetUserId!)
          .maybeSingle();
        if (legacy.error) throw legacy.error;
        return !!legacy.data;
      }
      if (error) throw error;
      return !!data;
    },
  });
}
