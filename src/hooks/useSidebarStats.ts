import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { COMMUNITY_META } from "@/lib/communities";

/** Real post counts per community, plus 3 most-active startups, for RightSidebar. */
export function useSidebarStats() {
  return useQuery({
    queryKey: ["sidebar-stats"],
    queryFn: async () => {
      // Fetch themed accounts grouped by category and counts
      const [accRes, startupsRes, themedPostsRes, startupPostsRes] = await Promise.all([
        supabase.from("themed_accounts").select("id, category"),
        supabase.from("startups").select("id, name, slug, category"),
        supabase.from("themed_posts").select("account_id"),
        supabase.from("startup_posts").select("startup_id, published_at").order("published_at", { ascending: false }).limit(200),
      ]);

      const themedByCat = new Map<string, Set<string>>(); // category -> account ids
      for (const a of accRes.data || []) {
        if (!themedByCat.has(a.category)) themedByCat.set(a.category, new Set());
        themedByCat.get(a.category)!.add(a.id);
      }
      const startupsArr = startupsRes.data || [];
      const themedPostCount = new Map<string, number>(); // category -> posts
      const accCat = new Map<string, string>();
      for (const a of accRes.data || []) accCat.set(a.id, a.category);
      for (const p of themedPostsRes.data || []) {
        const cat = accCat.get(p.account_id);
        if (cat) themedPostCount.set(cat, (themedPostCount.get(cat) || 0) + 1);
      }

      const communities = COMMUNITY_META.map((meta) => {
        let posts = 0;
        let accounts = 0;
        for (const cat of meta.themedCategories) {
          posts += themedPostCount.get(cat) || 0;
          accounts += themedByCat.get(cat)?.size || 0;
        }
        accounts += startupsArr.filter((s) =>
          meta.startupCategoryMatches.some((m) => s.category?.toLowerCase().includes(m))
        ).length;
        return { ...meta, posts, accounts };
      }).sort((a, b) => b.posts - a.posts);

      // Top 3 most-active startups (by recent post count)
      const recentByStartup = new Map<string, number>();
      for (const p of startupPostsRes.data || []) {
        recentByStartup.set(p.startup_id, (recentByStartup.get(p.startup_id) || 0) + 1);
      }
      const topStartups = startupsArr
        .map((s) => ({ ...s, recent: recentByStartup.get(s.id) || 0 }))
        .sort((a, b) => b.recent - a.recent)
        .slice(0, 3);

      return { communities, topStartups };
    },
    staleTime: 5 * 60 * 1000,
  });
}
