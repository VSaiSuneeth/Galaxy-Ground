import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useCallback } from "react";
import { fetchPostById } from "./usePosts";
import type { FeedPost } from "@/types/feed";
import { asArray, normalizeFeedPosts } from "@/lib/safe-data";
import { QUERY_DEFAULTS } from "@/lib/query-config";

type BookmarkSource = NonNullable<FeedPost["source"]>;

function normalizeBookmarkSource(source: FeedPost["source"] | undefined): BookmarkSource {
  if (source === "startup" || source === "themed" || source === "user") return source;
  return "user";
}

export function useBookmarks() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["bookmarks", user?.id],
    enabled: !!user,
    ...QUERY_DEFAULTS,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("post_id")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) return [];
      return asArray<{ post_id: string }>(data).map((r) => r.post_id).filter(Boolean);
    },
  });

  const toggleBookmark = useCallback(
    async (postId: string, isBookmarked: boolean, source?: FeedPost["source"]) => {
      if (!user) {
        toast.error("Sign in to save posts");
        return;
      }
      const postSource = normalizeBookmarkSource(source);
      if (isBookmarked) {
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", postId);
        if (error) return toast.error(error.message);
        toast.success("Removed from saved posts");
      } else {
        const { error } = await supabase.from("bookmarks").insert({
          user_id: user.id,
          post_id: postId,
          post_source: postSource,
        });
        if (error) return toast.error(error.message);
        toast.success("Post saved");
      }
      qc.invalidateQueries({ queryKey: ["bookmarks", user.id] });
      qc.invalidateQueries({ queryKey: ["bookmarked-posts", user.id] });
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["post-by-id"] });
    },
    [qc, user]
  );

  return { ...q, data: asArray(q.data), toggleBookmark };
}

export function useBookmarkedPosts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["bookmarked-posts", user?.id],
    enabled: !!user,
    ...QUERY_DEFAULTS,
    queryFn: async (): Promise<FeedPost[]> => {
      const { data: rows, error } = await supabase
        .from("bookmarks")
        .select("post_id, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) return [];
      const ids = asArray<{ post_id: string }>(rows).map((r) => r.post_id).filter(Boolean);
      if (!ids.length) return [];

      const posts = await Promise.all(ids.map((id) => fetchPostById(id)));
      return normalizeFeedPosts(posts.filter((p): p is FeedPost => p !== null));
    },
  });
}
