import { Heart, MessageCircle, Share2, Trash2, ExternalLink, Rocket, Sparkles, BadgeCheck, MoreHorizontal, Bookmark } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { timeAgo, avatarEmoji } from "@/lib/post-utils";
import CommentsSection from "./CommentsSection";
import MediaLightbox from "./MediaLightbox";
import type { FeedPost } from "@/types/feed";
import { asArray, logDataIssue, normalizeFeedPost } from "@/lib/safe-data";
import { useFollow } from "@/hooks/useFollow";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useUserBadges } from "@/hooks/useUserBadges";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { extractHashtags } from "@/lib/post-utils";

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
    let error: any = null;
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

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-4 hover:border-primary/20 transition-colors"
      >
        <div className="flex items-center gap-3 mb-3">
          <Link
            to={profileHref}
            className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-primary overflow-hidden hover:ring-2 hover:ring-primary/40 transition-all"
          >
            {author?.avatar_url ? (
              <img src={author.avatar_url} alt={displayName} className="h-full w-full object-cover" loading="lazy" />
            ) : isStartup ? (
              <Rocket className="h-5 w-5" />
            ) : isThemed ? (
              <Sparkles className="h-5 w-5" />
            ) : (
              avatarEmoji(post.user_id)
            )}
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
              <span className="text-xs text-muted-foreground">@{username}</span>
              {!hideFollow && (
                <button
                  onClick={toggleFollow}
                  disabled={followBusy}
                  className={`ml-auto px-2 py-1 rounded-md text-xs transition-colors ${
                    isFollowing ? "border border-glass-border text-foreground hover:bg-muted/40" : "bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              )}
              {isStartup && (
                <span className="text-[10px] uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Startup
                </span>
              )}
              {isThemed && (
                <span className="text-[10px] uppercase tracking-wider text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                  Creator
                </span>
              )}
              {post.community && (
                <Link
                  to={`/community/${post.community}`}
                  className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full hover:bg-primary/20"
                >
                  {post.community}
                </Link>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</p>
          </div>
          {isUser && user?.id === post.user_id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
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
              className="w-full min-h-[110px] bg-muted/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            <div className="flex gap-2">
              <button onClick={updatePost} className="px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground">Save</button>
              <button onClick={() => { setIsEditing(false); setEditingText(post.content); }} className="px-3 py-1.5 rounded-lg text-sm border border-glass-border">Cancel</button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground/90 mb-2 leading-relaxed whitespace-pre-wrap break-words">
            {renderWithHashtags(visibleText)}
          </p>
        )}
        {isLong && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-xs text-primary hover:underline mb-3"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}

        {post.media_url && post.media_type === "image" && !imgErrored && (
          <div
            className="rounded-lg overflow-hidden mb-3 border border-glass-border cursor-zoom-in group relative"
            onClick={() => setLightbox(true)}
          >
            <img
              src={post.media_url}
              alt=""
              loading="lazy"
              onError={() => setImgErrored(true)}
              className="w-full max-h-[500px] object-cover transition-transform group-hover:scale-[1.02]"
            />
          </div>
        )}
        {post.media_url && post.media_type === "video" && (
          <div
            className="rounded-lg overflow-hidden mb-3 border border-glass-border cursor-pointer"
            onClick={() => setLightbox(true)}
          >
            <video src={post.media_url} className="w-full max-h-[500px] pointer-events-none" />
          </div>
        )}

        <div className="flex items-center gap-1 pt-2 border-t border-glass-border">
          <Popover open={reactionOpen} onOpenChange={setReactionOpen}>
            <PopoverTrigger asChild>
              <button
                onClick={() => toggleLike(myReaction || "like")}
                onContextMenu={(e) => { e.preventDefault(); setReactionOpen(true); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  liked ? "text-destructive bg-destructive/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Heart className={`h-4 w-4 transition-transform ${liked ? "fill-current scale-110" : ""}`} />
                <span>{likes}</span>
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{commentCount}</span>
          </button>
          {!isUser && post.source_url && (
            <a
              href={post.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Source</span>
            </a>
          )}
          <button
            onClick={share}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </button>
          <button
            onClick={() => toggleBookmark(post.id, isBookmarked, post.source || "user")}
            className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              isBookmarked ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
      </motion.article>

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
