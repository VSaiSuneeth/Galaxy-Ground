import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { asArray, flattenPostPages, logDataIssue, normalizeFeedPost, normalizeFeedPosts } from "@/lib/safe-data";
import { QUERY_DEFAULTS } from "@/lib/query-config";
import type { FeedPost } from "@/types/feed";
import type { Database } from "@/integrations/supabase/types";
import { buildGeneratedPostDisplay } from "@/lib/generated-content-presentation";

export type { FeedPost };

type TableOrView = keyof (Database["public"]["Tables"] & Database["public"]["Views"]);
type TableRow<Table extends TableOrView> = (Database["public"]["Tables"] & Database["public"]["Views"])[Table]["Row"];
type LikeRow = Pick<TableRow<"likes">, "post_id">;
type ReactionRow = Pick<TableRow<"aggregate_reactions">, "target_type" | "target_id" | "reaction_type">;
type BookmarkRow = Pick<TableRow<"bookmarks">, "post_id">;
type PostRow = Pick<TableRow<"posts">, "id" | "user_id" | "content" | "media_url" | "media_type" | "community" | "hashtags" | "created_at">;
type ProfileRow = Pick<TableRow<"profiles">, "user_id" | "username" | "display_name" | "avatar_url">;
type PostStatRow = Pick<TableRow<"post_stats">, "post_id" | "likes_count" | "comments_count">;

interface Filter {
  userId?: string;
  hashtag?: string;
  community?: string;
  /** Include startup + themed posts (Home, hashtag pages) */
  includeAggregated?: boolean;
  mode?: "for-you" | "following" | "recent";
  pageSize?: number;
  infinite?: boolean;
  /** When false, skips the query (e.g. profile posts until user id is ready) */
  enabled?: boolean;
}

const DEFAULT_PAGE_SIZE = 20;

const hydrateFeedPostsWithInteractions = async (posts: FeedPost[], userId?: string): Promise<FeedPost[]> => {
  if (!userId || !posts.length) {
    return posts.map((post) => ({
      ...post,
      user_has_liked: false,
      user_has_bookmarked: false,
      reaction_type: null,
    }));
  }

  const userPostIds = posts.filter((post) => post.source === "user" && post.id).map((post) => post.id);
  const aggregatePosts = posts.filter((post) => post.source && post.source !== "user" && post.target_id);
  const aggregateTargetTypes = Array.from(new Set(aggregatePosts.map((post) => post.source).filter((value): value is "startup" | "themed" => value === "startup" || value === "themed")));
  const aggregateTargetIds = aggregatePosts.map((post) => post.target_id).filter(Boolean) as string[];
  const bookmarkIds = posts.map((post) => post.id).filter(Boolean);

  const [likesResult, reactionsResult, bookmarksResult] = await Promise.all([
    userPostIds.length
      ? supabase.from("likes").select("post_id").eq("user_id", userId).in("post_id", userPostIds)
      : Promise.resolve({ data: [] as LikeRow[] }),
    aggregateTargetIds.length && aggregateTargetTypes.length
      ? supabase.from("aggregate_reactions").select("target_type, target_id, reaction_type").eq("user_id", userId).in("target_type", aggregateTargetTypes).in("target_id", aggregateTargetIds)
      : Promise.resolve({ data: [] as ReactionRow[] }),
    bookmarkIds.length
      ? supabase.from("bookmarks").select("post_id").eq("user_id", userId).in("post_id", bookmarkIds)
      : Promise.resolve({ data: [] as BookmarkRow[] }),
  ]);

  const likedPostIds = new Set(asArray<LikeRow>(likesResult.data).map((row) => row.post_id).filter(Boolean));
  const reactedByTarget = new Map<string, string | null>();
  for (const row of asArray<ReactionRow>(reactionsResult.data)) {
    const targetType = row.target_type as "startup" | "themed" | undefined;
    const targetId = row.target_id as string | undefined;
    if (targetType && targetId) reactedByTarget.set(`${targetType}:${targetId}`, row.reaction_type ?? null);
  }
  const bookmarkedPostIds = new Set(asArray<BookmarkRow>(bookmarksResult.data).map((row) => row.post_id).filter(Boolean));

  return posts.map((post) => {
    const reactionKey = post.source && post.source !== "user" && post.target_id ? `${post.source}:${post.target_id}` : null;
    return {
      ...post,
      user_has_liked: post.source === "user" ? likedPostIds.has(post.id) : !!reactionKey && reactedByTarget.has(reactionKey),
      user_has_bookmarked: bookmarkedPostIds.has(post.id),
      reaction_type: reactionKey ? reactedByTarget.get(reactionKey) ?? null : null,
    };
  });
};

const getFeedPage = async (filter: Filter = {}, page: number): Promise<FeedPost[]> => {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const me = authData?.user?.id;
    const pageSize = filter.pageSize ?? DEFAULT_PAGE_SIZE;
    const mode = filter.mode === "following" ? "following" : filter.mode === "recent" ? "recent" : "for-you";

    // For profile-specific feeds, still use direct queries (RPC doesn't support userId filter)
    if (filter.userId) {
      return getProfileFeed(filter, page, me);
    }

    // For community-specific feeds, still use direct queries (RPC doesn't support community filter)
    if (filter.community) {
      return getCommunityFeed(filter, page, me);
    }

    // For hashtag-specific feeds, still use direct queries (RPC doesn't support hashtag filter)
    if (filter.hashtag) {
      return getHashtagFeed(filter, page, me);
    }

    // Use the deployed RPC for the main feed
    const { data: rpcData, error } = await supabase.rpc("get_feed_page", {
      p_user_id: me || null,
      p_page_offset: page,
      p_page_size: pageSize,
      p_mode: mode,
    });

    if (error) {
      logDataIssue("usePosts: get_feed_page RPC failed", error);
      return [];
    }

    const posts = asArray<FeedPost>(rpcData).map((post) => ({
      ...post,
      reaction_summary: post.reaction_summary || [],
    }));

    // Hydrate with user-specific interactions (RPC doesn't include these)
    const hydrated = await hydrateFeedPostsWithInteractions(posts, me);
    return normalizeFeedPosts(hydrated);
  } catch (error) {
    logDataIssue("usePosts: unexpected feed failure", error);
    return [];
  }
};

// Fallback for profile-specific feeds
const getProfileFeed = async (filter: Filter, page: number, userId?: string): Promise<FeedPost[]> => {
  const pageSize = filter.pageSize ?? DEFAULT_PAGE_SIZE;
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, user_id, content, media_url, media_type, community, hashtags, created_at")
    .eq("user_id", filter.userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    logDataIssue("usePosts: profile feed query failed", error);
    return [];
  }

  const postRows = asArray<PostRow>(posts);
  const userIds = Array.from(new Set(postRows.map((p) => p.user_id).filter(Boolean)));
  const postIds = postRows.map((p) => p.id).filter(Boolean);

  const [profilesRes, statsRes] = await Promise.all([
    userIds.length
      ? supabase.from("profiles").select("user_id, username, display_name, avatar_url").in("user_id", userIds)
      : Promise.resolve({ data: [] as ProfileRow[] }),
    postIds.length
      ? supabase.from("post_stats").select("post_id, likes_count, comments_count").in("post_id", postIds)
      : Promise.resolve({ data: [] as PostStatRow[] }),
  ]);

  const profileMap = new Map(asArray<ProfileRow>(profilesRes.data).map((profile) => [profile.user_id, profile]));
  const statMap = new Map(asArray<PostStatRow>(statsRes.data).map((stat) => [stat.post_id, stat]));

  const userFeed: FeedPost[] = postRows.map((p) =>
    normalizeFeedPost({
      ...(p as Record<string, unknown>),
      source: "user",
      author: (profileMap.get(p.user_id) as FeedPost["author"]) || null,
      likes_count: Number((statMap.get(p.id) as { likes_count?: number })?.likes_count || 0),
      comments_count: Number((statMap.get(p.id) as { comments_count?: number })?.comments_count || 0),
    })
  );

  const hydrated = await hydrateFeedPostsWithInteractions(userFeed, userId);
  return normalizeFeedPosts(hydrated);
};

// Fallback for community-specific feeds
const getCommunityFeed = async (filter: Filter, page: number, userId?: string): Promise<FeedPost[]> => {
  const pageSize = filter.pageSize ?? DEFAULT_PAGE_SIZE;
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, user_id, content, media_url, media_type, community, hashtags, created_at")
    .eq("community", filter.community)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    logDataIssue("usePosts: community feed query failed", error);
    return [];
  }

  const postRows = asArray<PostRow>(posts);
  const userIds = Array.from(new Set(postRows.map((p) => p.user_id).filter(Boolean)));
  const postIds = postRows.map((p) => p.id).filter(Boolean);

  const [profilesRes, statsRes] = await Promise.all([
    userIds.length
      ? supabase.from("profiles").select("user_id, username, display_name, avatar_url").in("user_id", userIds)
      : Promise.resolve({ data: [] as ProfileRow[] }),
    postIds.length
      ? supabase.from("post_stats").select("post_id, likes_count, comments_count").in("post_id", postIds)
      : Promise.resolve({ data: [] as PostStatRow[] }),
  ]);

  const profileMap = new Map(asArray<ProfileRow>(profilesRes.data).map((profile) => [profile.user_id, profile]));
  const statMap = new Map(asArray<PostStatRow>(statsRes.data).map((stat) => [stat.post_id, stat]));

  const userFeed: FeedPost[] = postRows.map((p) =>
    normalizeFeedPost({
      ...(p as Record<string, unknown>),
      source: "user",
      author: (profileMap.get(p.user_id) as FeedPost["author"]) || null,
      likes_count: Number((statMap.get(p.id) as { likes_count?: number })?.likes_count || 0),
      comments_count: Number((statMap.get(p.id) as { comments_count?: number })?.comments_count || 0),
    })
  );

  const hydrated = await hydrateFeedPostsWithInteractions(userFeed, userId);
  return normalizeFeedPosts(hydrated);
};

// Fallback for hashtag-specific feeds
const getHashtagFeed = async (filter: Filter, page: number, userId?: string): Promise<FeedPost[]> => {
  const pageSize = filter.pageSize ?? DEFAULT_PAGE_SIZE;
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, user_id, content, media_url, media_type, community, hashtags, created_at")
    .contains("hashtags", [filter.hashtag?.toLowerCase()])
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    logDataIssue("usePosts: hashtag feed query failed", error);
    return [];
  }

  const postRows = asArray<PostRow>(posts);
  const userIds = Array.from(new Set(postRows.map((p) => p.user_id).filter(Boolean)));
  const postIds = postRows.map((p) => p.id).filter(Boolean);

  const [profilesRes, statsRes] = await Promise.all([
    userIds.length
      ? supabase.from("profiles").select("user_id, username, display_name, avatar_url").in("user_id", userIds)
      : Promise.resolve({ data: [] as ProfileRow[] }),
    postIds.length
      ? supabase.from("post_stats").select("post_id, likes_count, comments_count").in("post_id", postIds)
      : Promise.resolve({ data: [] as PostStatRow[] }),
  ]);

  const profileMap = new Map(asArray<ProfileRow>(profilesRes.data).map((profile) => [profile.user_id, profile]));
  const statMap = new Map(asArray<PostStatRow>(statsRes.data).map((stat) => [stat.post_id, stat]));

  const userFeed: FeedPost[] = postRows.map((p) =>
    normalizeFeedPost({
      ...(p as Record<string, unknown>),
      source: "user",
      author: (profileMap.get(p.user_id) as FeedPost["author"]) || null,
      likes_count: Number((statMap.get(p.id) as { likes_count?: number })?.likes_count || 0),
      comments_count: Number((statMap.get(p.id) as { comments_count?: number })?.comments_count || 0),
    })
  );

  const hydrated = await hydrateFeedPostsWithInteractions(userFeed, userId);
  return normalizeFeedPosts(hydrated);
};

type InfiniteFilter = Filter & { infinite: true };
type SingleFilter = Filter & { infinite?: false | undefined };

export function usePosts(filter: InfiniteFilter): ReturnType<typeof useInfinitePostsQuery>;
export function usePosts(filter?: SingleFilter): ReturnType<typeof useSinglePostsQuery>;
export function usePosts(filter: Filter = {}) {
  const isInfinite = !!filter.infinite;
  const singleKey = ["posts", "single", filter];
  const infiniteKey = ["posts", "infinite", filter];
  const userFilterReady = filter.userId === undefined || !!filter.userId;
  const queryEnabled = filter.enabled !== false && userFilterReady;

  const single = useSinglePostsQuery(filter, singleKey, queryEnabled && !isInfinite);
  const infinite = useInfinitePostsQuery(filter, infiniteKey, queryEnabled && isInfinite);

  return isInfinite ? infinite : single;
}

function useSinglePostsQuery(filter: Filter, queryKey: unknown[], queryEnabled: boolean) {
  const single = useQuery({
    queryKey,
    enabled: queryEnabled,
    ...QUERY_DEFAULTS,
    queryFn: async (): Promise<FeedPost[]> => normalizeFeedPosts(await getFeedPage(filter, 0)),
  });

  const postList = normalizeFeedPosts(single.data);
  return { ...single, data: postList, isEmpty: postList.length === 0 };
}

function useInfinitePostsQuery(filter: Filter, queryKey: unknown[], queryEnabled: boolean) {
  const infinite = useInfiniteQuery({
    queryKey,
    enabled: queryEnabled,
    ...QUERY_DEFAULTS,
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<FeedPost[]> => {
      const page = typeof pageParam === "number" && Number.isFinite(pageParam) ? pageParam : 0;
      return normalizeFeedPosts(await getFeedPage(filter, page));
    },
    getNextPageParam: (lastPage, allPages) => {
      const pageSize = filter.pageSize ?? DEFAULT_PAGE_SIZE;
      const safePage = Array.isArray(lastPage) ? lastPage : [];
      const safePages = Array.isArray(allPages) ? allPages : [];
      return safePage.length < pageSize ? undefined : safePages.length;
    },
  });

  const postList = flattenPostPages(infinite.data?.pages);
  return {
    ...infinite,
    data: postList,
    isEmpty: postList.length === 0,
  };
}

/** Resolve a feed post by composite id (user uuid, or startup_/themed_ prefix). */
export async function fetchPostById(id: string): Promise<FeedPost | null> {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (id.startsWith("startup_")) {
        const targetId = id.replace("startup_", "");
        const { data } = await supabase
          .from("startup_posts")
          .select("id, startup_id, title, content, summary, source_url, image_url, hashtags, published_at, startups(slug, name, logo_url, category)")
          .eq("id", targetId)
          .maybeSingle();
        if (!data) return null;
        const display = buildGeneratedPostDisplay({
          title: data.title,
          content: data.content,
          summary: data.summary,
          hashtags: data.hashtags,
          category: data.startups?.category,
          authorName: data.startups?.name,
          kind: "startup",
        });
        const hydrated = await hydrateFeedPostsWithInteractions([normalizeFeedPost({
          id: `startup_${data.id}`,
          user_id: `startup_${data.startup_id}`,
          content: display.content,
          media_url: data.image_url || null,
          media_type: data.image_url ? "image" : null,
          community: null,
          hashtags: display.hashtags.length ? display.hashtags : data.hashtags || [],
          created_at: data.published_at,
          author: {
            user_id: `startup_${data.startup_id}`,
            username: data.startups?.slug || "startup",
            display_name: data.startups?.name || "Startup",
            avatar_url: data.startups?.logo_url || null,
          },
          likes_count: 0,
          comments_count: 0,
          source: "startup",
          target_id: data.id,
          startup_slug: data.startups?.slug,
          source_url: data.source_url,
          startup_id: data.startup_id,
        })], userId);
        return hydrated[0] ?? null;
      }
      if (id.startsWith("themed_")) {
        const targetId = id.replace("themed_", "");
        const { data } = await supabase
          .from("themed_posts")
          .select("id, account_id, title, content, summary, source_url, image_url, hashtags, published_at, themed_accounts(handle, display_name, avatar_url, category)")
          .eq("id", targetId)
          .maybeSingle();
        if (!data) return null;
        const display = buildGeneratedPostDisplay({
          title: data.title,
          content: data.content,
          summary: data.summary,
          hashtags: data.hashtags,
          category: data.themed_accounts?.category,
          authorName: data.themed_accounts?.display_name,
          kind: "themed",
        });
        const hydrated = await hydrateFeedPostsWithInteractions([normalizeFeedPost({
          id: `themed_${data.id}`,
          user_id: `themed_${data.account_id}`,
          content: display.content,
          media_url: data.image_url || null,
          media_type: data.image_url ? "image" : null,
          community: null,
          hashtags: display.hashtags.length ? display.hashtags : data.hashtags || [],
          created_at: data.published_at,
          author: {
            user_id: `themed_${data.account_id}`,
            username: data.themed_accounts?.handle || "creator",
            display_name: data.themed_accounts?.display_name || "Creator",
            avatar_url: data.themed_accounts?.avatar_url || null,
          },
          likes_count: 0,
          comments_count: 0,
          source: "themed",
          target_id: data.id,
          themed_handle: data.themed_accounts?.handle,
          source_url: data.source_url,
          account_id: data.account_id,
        })], userId);
        return hydrated[0] ?? null;
      }
      const { data } = await supabase
        .from("posts")
        .select("id, user_id, content, media_url, media_type, community, hashtags, created_at")
        .eq("id", id)
        .maybeSingle();
      if (!data) return null;
      const [{ data: author }, { data: stats }] = await Promise.all([
        supabase.from("profiles").select("user_id, username, display_name, avatar_url").eq("user_id", data.user_id).maybeSingle(),
        supabase.from("post_stats").select("post_id, likes_count, comments_count").eq("post_id", data.id).maybeSingle(),
      ]);
      const hydrated = await hydrateFeedPostsWithInteractions([normalizeFeedPost({
        ...data,
        source: "user",
        author: author || null,
        likes_count: Number(stats?.likes_count || 0),
        comments_count: Number(stats?.comments_count || 0),
        media_type: data.media_type as "image" | "video" | null,
      })], userId);
      return hydrated[0] ?? null;
}

export function usePostById(id?: string) {
  return useQuery({
    queryKey: ["post-by-id", id],
    enabled: !!id,
    ...QUERY_DEFAULTS,
    queryFn: () => fetchPostById(id!),
  });
}
