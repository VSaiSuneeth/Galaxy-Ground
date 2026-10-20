import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useThemedAccount, useThemedAccountPosts } from "@/hooks/useThemed";
import PostCard from "@/components/PostCard";
import FollowButton from "@/components/FollowButton";
import { useFollow } from "@/hooks/useFollow";
import type { FeedPost } from "@/types/feed";
import { asArray, normalizeFeedPost } from "@/lib/safe-data";

const ThemedAccountPage = () => {
  const { handle = "" } = useParams();
  const { data: account, isLoading } = useThemedAccount(handle);
  const { data: posts } = useThemedAccountPosts(account?.id);
  const { followers } = useFollow({ targetType: "themed", targetId: account?.id });

  if (isLoading) {
    return <div className="glass-panel p-8 text-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (!account) {
    return (
      <div className="glass-panel p-8 text-center">
        <p className="text-sm text-muted-foreground">Creator not found.</p>
        <Link to="/" className="text-xs text-primary mt-2 inline-block">Back to feed</Link>
      </div>
    );
  }

  const postRows = asArray(posts);
  const feedPosts: FeedPost[] = postRows.map((tp) =>
    normalizeFeedPost({
      id: `themed_${tp.id}`,
      user_id: `themed_${account.id}`,
      content: tp.content,
      media_url: tp.image_url,
      media_type: tp.image_url ? "image" : null,
      community: null,
      hashtags: tp.hashtags,
      created_at: tp.published_at,
      author: {
        user_id: `themed_${account.id}`,
        username: account.handle,
        display_name: account.display_name,
        avatar_url: account.avatar_url,
      },
      likes_count: tp.likes_count || 0,
      comments_count: tp.comments_count || 0,
      source: "themed",
      target_id: tp.id,
      themed_handle: account.handle,
      source_url: tp.source_url,
    })
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to feed
      </Link>

      <div className="glass-panel p-6">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-2xl bg-secondary/20 flex items-center justify-center text-secondary shrink-0">
            {account.avatar_url ? (
              <img src={account.avatar_url} alt={account.display_name} className="h-full w-full object-cover rounded-2xl" />
            ) : (
              <Sparkles className="h-8 w-8" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{account.display_name}</h1>
              <span className="text-[10px] uppercase tracking-wider text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                Creator
              </span>
            </div>
            <p className="text-xs text-muted-foreground">@{account.handle} · {account.category}</p>
            {account.bio && <p className="text-sm text-foreground/80 mt-2">{account.bio}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 text-[11px] text-muted-foreground">
              {account.focus && <div><b className="text-foreground/70">Focus:</b> {account.focus}</div>}
              {account.style && <div><b className="text-foreground/70">Style:</b> {account.style}</div>}
              {account.vibe && <div><b className="text-foreground/70">Vibe:</b> {account.vibe}</div>}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs">
              <span><b className="text-foreground">{postRows.length}</b> <span className="text-muted-foreground">posts</span></span>
              <span><b className="text-foreground">{followers}</b> <span className="text-muted-foreground">followers</span></span>
            </div>
          </div>
          <FollowButton targetType="themed" targetId={account.id} />
        </div>
      </div>

      {feedPosts.length === 0 ? (
        <div className="glass-panel p-6 text-center text-sm text-muted-foreground">
          No posts yet — fresh updates land every few hours.
        </div>
      ) : (
        feedPosts.map((p) => <PostCard key={p.id} post={p} />)
      )}
    </div>
  );
};

export default ThemedAccountPage;
