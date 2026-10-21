import { Heart, MessageCircle, Share2, Trash2, ExternalLink, BadgeCheck, MoreHorizontal, Bookmark } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { timeAgo } from "@/lib/post-utils";
import CommentsSection from "./CommentsSection";
import MediaLightbox from "./MediaLightbox";
import ReportButton from "./ReportButton";
import { Patch } from "@/components/brand/Patch";
import { UserAvatar } from "@/components/brand/UserAvatar";
import type { FeedPost } from "@/types/feed";
import { asArray, logDataIssue, normalizeFeedPost } from "@/lib/safe-data";
import { useFollow } from "@/hooks/useFollow";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useUserBadges } from "@/hooks/useUserBadges";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { extractHashtags } from "@/lib/post-utils";
import { COMMUNITY_BY_SLUG } from "@/lib/communities";

interface Props {
  post: FeedPost;
  onDeleted?: () => void;
}

const TRUNCATE_LEN = 380;
const REACTION_OPTIONS = [
  { type: "like", label: "Like" },
  { type: "rocket", label: "Rocket" },
  { type: "telescope", label: "Scope" },
  { type: "star", label: "Star" },
];
const REACTION_LABELS = new Map(REACTION_OPTIONS.map((reaction) => [reaction.type, reaction.label]));

const PostCard = ({ post: rawPost, onDeleted }: Props) => {
  const post = useMemo(() => {
    if (!rawPost?.id) return null;
    return normalizeFeedPost(rawPost as FeedPost & Record<string, unknown>);
  }, [rawPost]);

  const { user } = useAuth();
  const [liked, setLiked] = useState(Boolean(post?.user_has_liked));
  const [likes, setLikes] = useState(post?.likes_count ?? 0);
  const [commentCount, setCommentCount] = useState(post?.comments_count ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingText, setEditingText] = useState(post?.content ?? "");
  const [reactionOpen, setReactionOpen] = useState(false);
  const [myReaction, setMyReaction] = useState<string | null>(post?.reaction_type ?? null);
  const [reactionSummary, setReactionSummary] = useState<Array<{ reaction_type: string; count: number }>>(post?.reaction_summary ?? []);
  const [imgErrored, setImgErrored] = useState(false);
  const { data: bookmarks, toggleBookmark } = useBookmarks();
  const bookmarkIds = asArray(bookmarks);
  const isBookmarked = post ? bookmarkIds.includes(post.id) : false;

  const isUser = post?.source === "user" || !post?.source;
  const isStartup = post?.source === "startup";
  const isThemed = post?.source === "themed";
  const aggregateType = isStartup ? "startup" : isThemed ? "themed" : null;
  const isVerified = isStartup || isThemed;
  const followTargetType = isStartup ? "startup" : isThemed ? "themed" : "user";
  const followTargetId = isStartup ? post?.startup_id : isThemed ? post?.account_id : post?.user_id;
  const authorId = isUser ? post?.user_id : isStartup ? post?.startup_id : post?.account_id;
  const { data: authorBadges = [] } = useUserBadges(authorId);
  const { isFollowing, toggle: toggleFollow, busy: followBusy } = useFollow({
    targetType: followTargetType,
    targetId: followTargetId,
  });
  const hideFollow = user?.id === post?.user_id;

  useEffect(() => {
    if (!post) return;
    setLiked(Boolean(post.user_has_liked));
    setMyReaction(post.reaction_type ?? null);
    setLikes(post.likes_count ?? 0);
    setCommentCount(post.comments_count ?? 0);
    setReactionSummary(post.reaction_summary ?? []);
    setEditingText(post.content);
  }, [post?.id, post?.content, post?.user_has_liked, post?.reaction_type, post?.likes_count, post?.comments_count, post?.reaction_summary]);

  if (!post) {
    logDataIssue("PostCard received invalid post", rawPost);
    return null;
  }

  const toggleLike = async (reactionType = "like") => {
    if (!user) { toast.error("Sign in to like posts"); return; }
    const willLike = !liked;
    setLiked(willLike);
    setMyReaction(willLike ? reactionType : null);
    setLikes((n) => n + (willLike ? 1 : -1));
    let error: { message: string } | null = null;
    if (isUser) {
      ({ error } = willLike
        ? await supabase.from("likes").insert({ post_id: post.id, user_id: user.id })
        : await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", user.id));
    } else if (aggregateType && post.target_id) {
      ({ error } = willLike
        ? await supabase.from("aggregate_reactions").insert({
            target_type: aggregateType, target_id: post.target_id, user_id: user.id, reaction_type: reactionType,
          })
        : await supabase.from("aggregate_reactions").delete()
            .eq("target_type", aggregateType).eq("target_id", post.target_id).eq("user_id", user.id));
    }
    if (error) {
      setLiked(!willLike);
      setMyReaction(liked ? reactionType : null);
      setLikes((n) => n + (willLike ? -1 : 1));
      toast.error(error.message);
    }
  };

  const share = () => {
    const postId = isUser ? post.id : `${isStartup ? "startup" : "themed"}_${post.target_id}`;
    const url = `${window.location.origin}/post/${postId}`;
    if (navigator.share) navigator.share({ title: "Galaxy Ground post", url }).catch(() => {});
    else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  };

  const updatePost = async () => {
    const cleaned = editingText.trim();
    if (!cleaned || !isUser) return;
    const { error } = await supabase
      .from("posts")
      .update({ content: cleaned, hashtags: extractHashtags(cleaned) })
      .eq("id", post.id);
    if (error) return toast.error(error.message);
    toast.success("Post updated");
    setIsEditing(false);
  };

  const del = async () => {
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) return toast.error(error.message);
    toast.success("Post deleted");
    onDeleted?.();
  };

  const author = post.author;
  const displayName = author?.display_name || author?.username || "Anonymous";
  const username = author?.username || "explorer";
  const profileHref = isStartup
    ? `/startup/${post.startup_slug}`
    : isThemed
    ? `/creator/${post.themed_handle}`
    : `/u/${post.user_id}`;

  const fullText = post.content || "";
  const isLong = fullText.length > TRUNCATE_LEN;
  const visibleText = expanded || !isLong ? fullText : fullText.slice(0, TRUNCATE_LEN).trimEnd() + "…";
  const orbitName = post.community
    ? COMMUNITY_BY_SLUG[post.community]?.name || post.community.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
    : null;

  return (
    <>
      <article className="border-b border-border px-3 py-4 transition-colors hover:bg-card/40 sm:px-4">
        <div className="flex items-center gap-3 mb-3">
          <Link to={profileHref} className="shrink-0">
            <UserAvatar src={author?.avatar_url} seed={authorId} label={displayName} size={44} shape={isUser ? "circle" : "squircle"} />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link to={profileHref} className="text-sm font-semibold text-foreground hover:text-primary">
                {displayName}
              </Link>
              {isVerified && (
                <BadgeCheck className="h-4 w-4 text-primary fill-primary/20" aria-label="Verified" />
              )}
              {authorBadges.length > 0 && (
                <div className="flex gap-1 ml-1">
                  {authorBadges.slice(0, 2).map((userBadge) => (
                    <img
                      key={userBadge.id}
                      src={userBadge.badge.image_url || undefined}
                      alt={userBadge.badge.name}
                      title={userBadge.badge.name}
                      className="h-4 w-4 rounded-full object-contain"
                    />
                  ))}
                </div>
              )}
              <span className="text-[13px] text-muted-foreground">@{username}</span>
              {!hideFollow && (
                <button
                  onClick={toggleFollow}
                  disabled={followBusy}
                  className={`ml-auto rounded-full px-2.5 py-1 text-[13px] transition-colors ${
                    isFollowing ? "border border-border text-foreground hover:bg-muted" : "border border-primary text-primary hover:bg-accent"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              )}
              {isStartup && (
                <span className="telemetry rounded-sm border border-border px-1.5 py-0.5 text-primary">
                  Startup
                </span>
              )}
              {isThemed && (
                <span className="telemetry rounded-sm border border-border px-1.5 py-0.5 text-primary">
                  Creator
                </span>
              )}
            </div>
            <p className="telemetry mt-0.5">{timeAgo(post.created_at)}</p>
          </div>
          {isUser && user?.id === post.user_id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button aria-label="Post options" className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={del} className="text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2 mb-2">
            <textarea
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              className="min-h-[110px] w-full rounded-md border border-input bg-muted px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button onClick={updatePost} className="rounded-full bg-brand px-3 py-1.5 text-sm font-semibold text-primary-foreground">Save</button>
              <button onClick={() => { setIsEditing(false); setEditingText(post.content); }} className="rounded-full border border-border px-3 py-1.5 text-sm">Cancel</button>
            </div>
          </div>
        ) : (
          <p className="mb-2 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-foreground">
            {renderWithHashtags(visibleText)}
          </p>
        )}
        {post.community && orbitName && (
          <Link to={`/community/${post.community}`} className="mb-3 inline-flex items-center gap-1.5 telemetry hover:text-primary">
            <Patch seed={post.community} label={orbitName} size={16} shape="squircle" />
            Orbit · {orbitName}
          </Link>
        )}
        {isLong && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="mb-3 text-[13px] text-primary hover:underline"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}

        {post.media_url && post.media_type === "image" && !imgErrored && (
          <div
            className="group relative mb-3 cursor-zoom-in overflow-hidden rounded-lg border border-border"
            onClick={() => setLightbox(true)}
          >
            <img
              src={post.media_url}
              alt=""
              loading="lazy"
              onError={() => setImgErrored(true)}
              className="max-h-[500px] w-full object-cover"
            />
          </div>
        )}
        {post.media_url && post.media_type === "video" && (
          <div
            className="mb-3 cursor-pointer overflow-hidden rounded-lg border border-border"
            onClick={() => setLightbox(true)}
          >
            <video src={post.media_url} className="w-full max-h-[500px] pointer-events-none" />
          </div>
        )}

        <div className="flex items-center gap-1 border-t border-border pt-2">
          <Popover open={reactionOpen} onOpenChange={setReactionOpen}>
            <PopoverTrigger asChild>
              <button
                onClick={() => toggleLike(myReaction || "like")}
                onContextMenu={(e) => { e.preventDefault(); setReactionOpen(true); }}
                aria-label="Boost post"
                title="Boost post"
                className={`flex min-h-10 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
                  liked ? "bg-accent text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Heart className={`h-4 w-4 transition-transform ${liked ? "fill-current scale-110" : ""}`} />
                <span className="font-mono text-[13px] tabular-nums">{likes}</span>
                {myReaction && <span className="text-xs">{REACTION_LABELS.get(myReaction) ?? myReaction}</span>}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="flex gap-1">
                {REACTION_OPTIONS.map((reaction) => (
                  <button
                    key={reaction.type}
                    onClick={() => { setReactionOpen(false); toggleLike(reaction.type); }}
                    className="h-9 px-2 rounded-full hover:bg-muted/40 transition-colors text-xs"
                  >
                    {reaction.label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <button
            onClick={() => setShowComments((s) => !s)}
            aria-label="Comments"
            title="Comments"
            className="flex min-h-10 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{commentCount}</span>
          </button>
          {!isUser && post.source_url && (
            <a
              href={post.source_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open source"
              title="Open source"
              className="flex min-h-10 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Source</span>
            </a>
          )}
          <button
            onClick={share}
            aria-label="Share post"
            title="Share post"
            className="flex min-h-10 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </button>
          {user?.id !== post.user_id && (
            <ReportButton
              targetType={isUser ? "post" : isStartup ? "startup_post" : "themed_post"}
              targetId={isUser ? post.id : post.target_id || post.id}
              className="text-muted-foreground hover:text-destructive"
            />
          )}
          <button
            onClick={() => toggleBookmark(post.id, isBookmarked, post.source || "user")}
            aria-label="Save post"
            title="Save post"
            className={`ml-auto flex min-h-10 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
              isBookmarked ? "bg-accent text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
            <span>Save</span>
          </button>
        </div>
        {asArray(reactionSummary).length > 0 && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            {asArray(reactionSummary).slice(0, 3).map((r) => (
              <span key={r.reaction_type} className="px-2 py-0.5 rounded-full bg-muted/30">
                {REACTION_LABELS.get(r.reaction_type) ?? r.reaction_type} {r.count}
              </span>
            ))}
          </div>
        )}

        {showComments && (
          isUser
            ? <CommentsSection postId={post.id} onCountChange={setCommentCount} />
            : aggregateType && post.target_id
              ? <CommentsSection targetType={aggregateType} targetId={post.target_id} onCountChange={setCommentCount} />
              : null
        )}
      </article>

      {post.media_url && (post.media_type === "image" || post.media_type === "video") && (
        <MediaLightbox
          src={post.media_url}
          type={post.media_type}
          open={lightbox}
          onClose={() => setLightbox(false)}
        />
      )}
    </>
  );
};

function renderWithHashtags(text: string | null | undefined) {
  const safe = text ?? "";
  const parts = safe.split(/(#[a-zA-Z0-9_]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("#")) {
      const tag = part.slice(1).toLowerCase();
      return (
        <Link key={i} to={`/hashtag/${tag}`} className="text-primary hover:underline">
          {part}
        </Link>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default PostCard;
