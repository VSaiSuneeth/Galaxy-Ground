import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { COMMUNITY_META, COMMUNITY_BY_SLUG, type CommunityMeta } from "@/lib/communities";

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || (error.message || "").toLowerCase().includes("does not exist");
}

async function fetchMembershipCountsBySlug(): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from("community_memberships")
    .select("community_id, communities(slug)");

  if (error) {
    if (isMissingTableError(error)) return new Map();
    throw error;
  }

  const counts = new Map<string, number>();
  for (const row of data || []) {
    const slug = (row as { communities?: { slug?: string } }).communities?.slug;
    if (!slug) continue;
    counts.set(slug, (counts.get(slug) || 0) + 1);
  }
  return counts;
}

export interface CommunityStats {
  meta: CommunityMeta;
  postsCount: number;
  membersCount: number;
  orbitMembersCount: number;
  accountsCount: number;
}

/**
 * Returns each community with REAL post + member counts derived from the
 * database. Posts = themed_posts in matching categories + startup_posts from
 * matching startup categories. Members = total followers of those accounts.
 */
export function useCommunitiesWithStats() {
  return useQuery({
    queryKey: ["communities-stats"],
    queryFn: async (): Promise<CommunityStats[]> => {
      const [accountsRes, startupsRes, themedPostsRes, startupPostsRes, followsRes, membershipCounts] = await Promise.all([
        supabase.from("themed_accounts").select("id, category"),
        supabase.from("startups").select("id, category"),
        supabase.from("themed_posts").select("id, account_id"),
        supabase.from("startup_posts").select("id, startup_id"),
        supabase.from("follows").select("target_type, target_id"),
        fetchMembershipCountsBySlug(),
      ]);

      const themedByCat = new Map<string, string[]>();
      for (const a of accountsRes.data || []) {
        const arr = themedByCat.get(a.category) || [];
        arr.push(a.id);
        themedByCat.set(a.category, arr);
      }
      const startupsList = startupsRes.data || [];

      // Posts per themed account
      const postsPerThemed = new Map<string, number>();
      for (const p of themedPostsRes.data || [])
        postsPerThemed.set(p.account_id, (postsPerThemed.get(p.account_id) || 0) + 1);
      const postsPerStartup = new Map<string, number>();
      for (const p of startupPostsRes.data || [])
        postsPerStartup.set(p.startup_id, (postsPerStartup.get(p.startup_id) || 0) + 1);

      // Followers per account
      const followers = new Map<string, number>(); // key: type|id
      for (const f of followsRes.data || []) {
        const k = `${f.target_type}|${f.target_id}`;
        followers.set(k, (followers.get(k) || 0) + 1);
      }

      return COMMUNITY_META.map((meta) => {
        const themedIds = meta.themedCategories.flatMap((c) => themedByCat.get(c) || []);
        const startupIds = startupsList
          .filter((s) =>
            meta.startupCategoryMatches.some((m) => (s.category || "").toLowerCase().includes(m.toLowerCase()))
          )
          .map((s) => s.id);

        const postsCount =
          themedIds.reduce((sum, id) => sum + (postsPerThemed.get(id) || 0), 0) +
          startupIds.reduce((sum, id) => sum + (postsPerStartup.get(id) || 0), 0);

        const membersCount =
          themedIds.reduce((sum, id) => sum + (followers.get(`themed|${id}`) || 0), 0) +
          startupIds.reduce((sum, id) => sum + (followers.get(`startup|${id}`) || 0), 0);

        return {
          meta,
          postsCount,
          membersCount,
          orbitMembersCount: membershipCounts.get(meta.slug) || 0,
          accountsCount: themedIds.length + startupIds.length,
        };
      });
    },
    staleTime: 30_000,
  });
}

export interface CommunityFeedItem {
  source: "themed" | "startup";
  id: string;
  account_id: string;
  account_name: string | null;
  account_handle: string | null;
  account_avatar: string | null;
  title: string | null;
  content: string;
  summary: string | null;
  image_url: string | null;
  hashtags: string[];
  source_url: string;
  published_at: string;
  likes_count: number;
  comments_count: number;
}

/** Posts + accounts for a single community page. */
export function useCommunityContent(slug: string) {
  return useQuery({
    queryKey: ["community-content", slug],
    enabled: !!slug,
    queryFn: async () => {
      const meta = COMMUNITY_BY_SLUG[slug];
      if (!meta) return { meta: null, accounts: [], startups: [], posts: [] as CommunityFeedItem[] };

      const [accRes, startupsRes] = await Promise.all([
        supabase
          .from("themed_accounts")
          .select("id, handle, display_name, category, focus, vibe, avatar_url")
          .in("category", meta.themedCategories.length ? meta.themedCategories : ["__none__"]),
        supabase.from("startups").select("id, slug, name, category, description, logo_url"),
      ]);

      const accounts = accRes.data || [];
      const accountIds = accounts.map((a) => a.id);

      const matchingStartups = (startupsRes.data || []).filter((s) =>
        meta.startupCategoryMatches.some((m) => (s.category || "").toLowerCase().includes(m.toLowerCase()))
      );
      const startupIds = matchingStartups.map((s) => s.id);

      const [themedPostsRes, startupPostsRes] = await Promise.all([
        accountIds.length
          ? supabase
              .from("themed_posts")
              .select(
                "id, account_id, title, content, summary, image_url, hashtags, source_url, published_at, themed_accounts(handle, display_name, avatar_url)"
              )
              .in("account_id", accountIds)
              .order("published_at", { ascending: false })
              .limit(60)
          : Promise.resolve({ data: [] as any[] }),
        startupIds.length
          ? supabase
              .from("startup_posts")
              .select(
                "id, startup_id, title, content, summary, image_url, hashtags, source_url, published_at, startups(slug, name, logo_url)"
              )
              .in("startup_id", startupIds)
              .order("published_at", { ascending: false })
              .limit(40)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      // counts
      const tIds = (themedPostsRes.data || []).map((p: any) => p.id);
      const sIds = (startupPostsRes.data || []).map((p: any) => p.id);
      const [rxT, rxS, cmT, cmS] = await Promise.all([
        tIds.length
          ? supabase.from("aggregate_reactions").select("target_id").eq("target_type", "themed").in("target_id", tIds)
          : Promise.resolve({ data: [] as any[] }),
        sIds.length
          ? supabase.from("aggregate_reactions").select("target_id").eq("target_type", "startup").in("target_id", sIds)
          : Promise.resolve({ data: [] as any[] }),
        tIds.length
          ? supabase.from("aggregate_comments").select("target_id").eq("target_type", "themed").in("target_id", tIds)
          : Promise.resolve({ data: [] as any[] }),
        sIds.length
          ? supabase.from("aggregate_comments").select("target_id").eq("target_type", "startup").in("target_id", sIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const tally = (rows: any) => {
        const m = new Map<string, number>();
        for (const r of rows.data || []) m.set(r.target_id, (m.get(r.target_id) || 0) + 1);
        return m;
      };
      const lT = tally(rxT), lS = tally(rxS), cT = tally(cmT), cS = tally(cmS);

      const themedFeed: CommunityFeedItem[] = (themedPostsRes.data || []).map((p: any) => ({
        source: "themed",
        id: p.id,
        account_id: p.account_id,
        account_name: p.themed_accounts?.display_name || null,
        account_handle: p.themed_accounts?.handle || null,
        account_avatar: p.themed_accounts?.avatar_url || null,
        title: p.title,
        content: p.content,
        summary: p.summary,
        image_url: p.image_url,
        hashtags: p.hashtags || [],
        source_url: p.source_url,
        published_at: p.published_at,
        likes_count: lT.get(p.id) || 0,
        comments_count: cT.get(p.id) || 0,
      }));

      const startupFeed: CommunityFeedItem[] = (startupPostsRes.data || []).map((p: any) => ({
        source: "startup",
        id: p.id,
        account_id: p.startup_id,
        account_name: p.startups?.name || null,
        account_handle: p.startups?.slug || null,
        account_avatar: p.startups?.logo_url || null,
        title: p.title,
        content: p.content,
        summary: p.summary,
        image_url: p.image_url,
        hashtags: p.hashtags || [],
        source_url: p.source_url,
        published_at: p.published_at,
        likes_count: lS.get(p.id) || 0,
        comments_count: cS.get(p.id) || 0,
      }));

      const posts = [...themedFeed, ...startupFeed].sort(
        (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      );

      return { meta, accounts, startups: matchingStartups, posts };
    },
  });
}
