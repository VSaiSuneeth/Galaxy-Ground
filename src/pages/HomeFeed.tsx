import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
import PostSkeleton from "@/components/PostSkeleton";
import { usePosts } from "@/hooks/usePosts";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Loader2, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { asArray } from "@/lib/safe-data";
import { useFeaturedContent } from "@/hooks/useFeaturedContent";
import { IntelTabContent } from "@/components/intel/IntelTabContent";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

type FeedMode = "for-you" | "following" | "recent" | "intel";

const HomeFeed = () => {
  const [mode, setMode] = useState<FeedMode>("for-you");
  const [pendingNew, setPendingNew] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const {
    data: posts,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePosts({ includeAggregated: true, mode, infinite: true, pageSize: 15 });
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
    <div className="max-w-2xl mx-auto space-y-4">
      <CreatePost onCreated={refresh} />

      {/* Spotlight Section */}
      {featuredContent && featuredContent.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Spotlight</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredContent.slice(0, 4).map((item) => (
              <a
                key={item.id}
                href={item.url || "#"}
                target={item.url ? "_blank" : undefined}
                rel="noreferrer"
                className="group"
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="h-48 w-full object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="h-48 bg-muted/30 flex items-center justify-center rounded-t-lg">
                      <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <CardHeader className="space-y-2">
                    <CardTitle className="line-clamp-2">{item.title}</CardTitle>
                    {item.description && (
                      <CardDescription className="text-sm text-muted-foreground line-clamp-3">
                        {item.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent />
                </Card>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="glass-panel p-2">
        <Tabs value={mode} onValueChange={(v) => setMode(v as FeedMode)}>
          <TabsList className="w-full grid grid-cols-4 bg-muted/40">
            <TabsTrigger value="for-you">For You</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="intel">Intel ✦</TabsTrigger>
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
              className="w-full glass-panel p-3 text-sm text-primary hover:bg-primary/10 transition-colors"
            >
              ✨ New posts available
            </button>
          )}
          {isLoading ? (
            <>
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </>
          ) : isError ? (
            <div className="glass-panel p-6 text-center">
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-destructive/10 text-destructive mb-3">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <p className="text-sm text-foreground">We could not load the feed right now.</p>
              {error instanceof Error && (
                <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto">{error.message}</p>
              )}
              <button onClick={() => refetch()} className="mt-3 px-4 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90">Retry</button>
            </div>
          ) : postList.length === 0 ? (
            <div className="glass-panel p-8 text-center text-sm text-muted-foreground space-y-3">
              {mode === "following" ? (
                <>
                  <p>Your orbit is quiet right now. Follow creators, startups, and communities to start building your feed.</p>
                  <Link to="/discover" className="inline-flex items-center text-primary hover:underline">Discover new people and launches</Link>
                </>
              ) : (
                <p>No posts yet. Be the first to share something cosmic 🌌</p>
              )}
            </div>
          ) : (
            <>
              {postList.map((p) => <PostCard key={p.id} post={p} onDeleted={refresh} />)}
              <div ref={sentinelRef} />
              {isFetchingNextPage && (
                <div className="glass-panel p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading more posts...
                </div>
              )}
              {!hasNextPage && postCount > 0 && (
                <div className="glass-panel p-4 text-center text-xs text-muted-foreground">You reached the end of the feed.</div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default HomeFeed;