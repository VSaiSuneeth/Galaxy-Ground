import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
import PostSkeleton from "@/components/PostSkeleton";
import { usePosts } from "@/hooks/usePosts";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { asArray } from "@/lib/safe-data";
import { useFeaturedContent } from "@/hooks/useFeaturedContent";
import { IntelTabContent } from "@/components/intel/IntelTabContent";

type FeedMode = "for-you" | "following" | "recent" | "intel";

const HomeFeed = () => {
  const [mode, setMode] = useState<FeedMode>("for-you");
  const [pendingNew, setPendingNew] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const {
    data: posts,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePosts({ includeAggregated: true, mode: mode === "intel" ? "for-you" : mode, infinite: true, pageSize: 15 });
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["posts"] });
  const postList = asArray(posts);
  const postCount = postList.length;

  const { data: featuredContent = [] } = useFeaturedContent();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "400px" }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const channel = supabase
      .channel(`home-feed-${mode}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, () => setPendingNew(true))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "startup_posts" }, () => setPendingNew(true))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "themed_posts" }, () => setPendingNew(true))
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [mode]);

  return (
    <div className="mx-auto max-w-2xl space-y-4 animate-enter">
      <CreatePost onCreated={refresh} />

      {/* Spotlight Section */}
      {featuredContent && featuredContent.length > 0 && (
        <section className="mb-6">
          <p className="telemetry mb-2">Today in space</p>
          <div className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-2 sm:-mx-4 sm:px-4">
            {featuredContent.slice(0, 6).map((item) => (
              <a
                key={item.id}
                href={item.url || "#"}
                target={item.url ? "_blank" : undefined}
                rel="noreferrer"
                className="group relative h-44 w-72 shrink-0 snap-start overflow-hidden rounded-lg border border-border bg-muted"
              >
                {item.image_url ? <img src={item.image_url} alt={item.title || "Today in space"} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <div className="flex h-full flex-col justify-end bg-card p-4"><span className="telemetry mb-2">Horizon</span><p className="line-clamp-3 font-display text-xl font-semibold leading-tight text-foreground">{item.title || "Mission briefing"}</p></div>}
                {item.image_url && <div className="absolute inset-x-0 bottom-0 bg-black/70 p-3 text-white">
                  <p className="line-clamp-2 font-display text-lg font-semibold leading-tight">{item.title || "Today in space"}</p>
                  {item.description && <p className="mt-1 line-clamp-1 text-[13px] text-white/75">{item.description}</p>}
                </div>}
              </a>
            ))}
          </div>
        </section>
      )}

      <div className="sticky top-0 z-20 -mx-3 border-y border-border bg-background px-3 py-2 sm:-mx-4 sm:px-4">
        <Tabs value={mode} onValueChange={(v) => setMode(v as FeedMode)}>
          <TabsList className="grid w-full grid-cols-4 bg-transparent">
            <TabsTrigger value="for-you">For You</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="intel">Intel</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {mode === "intel" ? (
        <IntelTabContent />
      ) : (
        <>
          {pendingNew && (
            <button
              onClick={() => { setPendingNew(false); refresh(); }}
              className="mx-auto block rounded-full bg-brand px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-brand/90 transition-colors"
            >
              New posts
            </button>
          )}
          {isLoading ? (
            <>
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </>
          ) : isError ? (
            <div className="border-y border-border py-10 text-center">
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-destructive/10 text-destructive mb-3">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <p className="text-sm text-foreground">We could not load the feed right now.</p>
              <button onClick={() => refetch()} className="mt-3 rounded-full border border-border px-4 py-1.5 text-sm hover:bg-muted">Retry</button>
            </div>
          ) : postList.length === 0 ? (
            <div className="border-y border-border py-10 text-center text-sm text-muted-foreground space-y-3">
              {mode === "following" ? (
                <>
                  <p>Nothing here yet. Follow a few startups, creators, or Orbits and their posts land here.</p>
                  <Link to="/discover" className="inline-flex items-center text-primary hover:underline">Discover new people and launches</Link>
                </>
              ) : (
                <p>Quiet on the channel. Be the first to post.</p>
              )}
            </div>
          ) : (
            <>
              {postList.map((p) => <PostCard key={p.id} post={p} onDeleted={refresh} />)}
              <div ref={sentinelRef} />
              {isFetchingNextPage && (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading more posts
                </div>
              )}
              {!hasNextPage && postCount > 0 && (
                <div className="border-t border-border py-4 text-center text-sm text-muted-foreground">You're all caught up.</div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default HomeFeed;
