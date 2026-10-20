import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TrendingTag {
  tag: string;
  count: number;
}

export function useTrendingHashtags(limit = 8) {
  return useQuery({
    queryKey: ["trending-hashtags", limit],
    queryFn: async (): Promise<TrendingTag[]> => {
      const [s, t, u] = await Promise.all([
        supabase.from("startup_posts").select("id, hashtags").limit(1000),
        supabase.from("themed_posts").select("id, hashtags").limit(1000),
        supabase.from("posts").select("id, hashtags").limit(1000),
      ]);
      const counts = new Map<string, number>();
      const validTag = (raw: string) => {
        const cleaned = raw.replace(/^#+/, "").trim().toLowerCase();
        if (!cleaned) return null;
        if (cleaned.length < 2 || cleaned.length > 40) return null;
        if (!/^[a-z0-9_]+$/.test(cleaned)) return null;
        if (/^\d+$/.test(cleaned)) return null;
        return cleaned;
      };
      for (const rs of [s.data || [], t.data || [], u.data || []]) {
        for (const row of rs) {
          const tagsInPost = new Set<string>();
          for (const tag of row.hashtags || []) {
            const normalized = validTag(tag);
            if (normalized) tagsInPost.add(normalized);
          }
          for (const normalized of tagsInPost) {
            counts.set(normalized, (counts.get(normalized) || 0) + 1);
          }
        }
      }
      return Array.from(counts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    },
    staleTime: 5 * 60 * 1000,
  });
}
