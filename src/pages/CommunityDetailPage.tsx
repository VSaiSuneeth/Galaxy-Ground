import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Sparkles, Building2, ExternalLink, Heart, MessageCircle } from "lucide-react";
import { useCommunityContent } from "@/hooks/useCommunities";
import FollowButton from "@/components/FollowButton";
import CommunityJoinButton from "@/components/CommunityJoinButton";
import { timeAgo } from "@/lib/post-utils";
import PostCard from "@/components/PostCard";
import type { FeedPost } from "@/types/feed";
import { asArray, normalizeFeedPost } from "@/lib/safe-data";
import { buildGeneratedPostDisplay } from "@/lib/generated-content-presentation";

const CommunityDetailPage = () => {
  const { slug = "" } = useParams();
  const { data, isLoading } = useCommunityContent(slug);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto glass-panel p-10 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data?.meta) {
    return (
      <div className="max-w-2xl mx-auto glass-panel p-8 text-center text-sm text-muted-foreground">
        Community not found.
      </div>
    );
  }

  const { meta } = data;
  const accounts = asArray(data.accounts);
  const startups = asArray(data.startups);
  const posts = asArray(data.posts);

  const feedPosts: FeedPost[] = posts.map((p) => {
    const display = buildGeneratedPostDisplay({
      title: p.title,
      content: p.content,
      summary: p.summary,
      hashtags: p.hashtags,
      category: meta.name,
      authorName: p.account_name,
      kind: p.source,
    });
    return normalizeFeedPost({
      id: `${p.source}_${p.id}`,
      user_id: `${p.source}_${p.account_id}`,
      content: display.content,
      media_url: p.image_url,
      media_type: p.image_url ? "image" : null,
      community: meta.name,
      hashtags: display.hashtags.length ? display.hashtags : p.hashtags,
      created_at: p.published_at,
      author: {
        user_id: `${p.source}_${p.account_id}`,
        username: p.account_handle,
        display_name: p.account_name,
        avatar_url: p.account_avatar,
      },
      likes_count: p.likes_count,
      comments_count: p.comments_count,
      source: p.source,
      target_id: p.id,
      startup_slug: p.source === "startup" ? p.account_handle ?? undefined : undefined,
      themed_handle: p.source === "themed" ? p.account_handle ?? undefined : undefined,
      source_url: p.source_url,
    });
  });

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Link to="/communities" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-3.5 w-3.5" /> All communities
      </Link>

      {/* Header */}
      <div className="glass-panel p-6">
        <div className="flex items-start gap-3">
          <div className="text-4xl">{meta.icon}</div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground">{meta.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{meta.description}</p>
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
              <span><b className="text-foreground">{accounts.length + startups.length}</b> accounts</span>
              <span><b className="text-foreground">{posts.length}</b> posts</span>
            </div>
            <div className="mt-4">
              <CommunityJoinButton slug={slug} />
            </div>
          </div>
        </div>
      </div>

      {/* Accounts in this community */}
      {(accounts.length > 0 || startups.length > 0) && (
        <div className="glass-panel p-5">
          <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider mb-3">
            Accounts in this community
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {accounts.map((a) => (
              <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                <Link
                  to={`/creator/${a.handle}`}
                  className="h-9 w-9 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0"
                >
                  {a.avatar_url ? (
                    <img src={a.avatar_url} alt="" className="h-full w-full object-cover rounded-lg" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-secondary" />
                  )}
                </Link>
                <Link to={`/creator/${a.handle}`} className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{a.display_name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">@{a.handle}</p>
                </Link>
                <FollowButton targetType="themed" targetId={a.id} size="sm" />
              </div>
            ))}
            {startups.map((s) => (
              <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                <Link
                  to={`/startup/${s.slug}`}
                  className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"
                >
                  {s.logo_url ? (
                    <img src={s.logo_url} alt="" className="h-full w-full object-cover rounded-lg" />
                  ) : (
                    <Building2 className="h-4 w-4 text-primary" />
                  )}
                </Link>
                <Link to={`/startup/${s.slug}`} className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">Startup · {s.category}</p>
                </Link>
                <FollowButton targetType="startup" targetId={s.id} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts */}
      <h2 className="text-sm font-semibold text-foreground px-1 pt-2">Latest posts</h2>
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

export default CommunityDetailPage;
