import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QUERY_DEFAULTS, SIDEBAR_SUGGESTIONS_STALE_MS } from "@/lib/query-config";
import { asArray } from "@/lib/safe-data";

export type WhoToFollowStartup = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

/** Stable daily "who to follow" list — sorted by name, no random shuffle. */
export function useWhoToFollow(limit = 3) {
  return useQuery({
    queryKey: ["who-to-follow", limit],
    ...QUERY_DEFAULTS,
    staleTime: SIDEBAR_SUGGESTIONS_STALE_MS,
    queryFn: async (): Promise<WhoToFollowStartup[]> => {
      const { data, error } = await supabase
        .from("startups")
        .select("id, name, slug, logo_url")
        .order("name", { ascending: true })
        .limit(20);
      if (error) return [];
      return asArray<WhoToFollowStartup>(data)
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, limit);
    },
  });
}
