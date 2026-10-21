import { useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, MapPin, Globe, UserPlus, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePosts } from "@/hooks/usePosts";
import PostCard from "@/components/PostCard";
import { toast } from "sonner";
import { UserAvatar } from "@/components/brand/UserAvatar";
import { useQueryClient } from "@tanstack/react-query";
import { useProfileByUserId, useProfileStats, useIsFollowingUser } from "@/hooks/useProfile";
import { PageError, PageLoading } from "@/components/PageState";
import { asArray, normalizeInterests } from "@/lib/safe-data";
import ConnectButton from "@/components/ConnectButton";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const UserProfilePage = () => {
  const { userId = "" } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const validId = UUID_RE.test(userId);

  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useProfileByUserId(validId ? userId : undefined);

  const { data: stats } = useProfileStats(validId ? userId : undefined);
  const { data: isFollowing, refetch: refetchFollow } = useIsFollowingUser(userId, user?.id);

  const {
    data: posts,
    isLoading: postsLoading,
    isError: postsError,
    error: postsErr,
    refetch: refetchPosts,
  } = usePosts({ userId: validId ? userId : undefined, enabled: validId });

  const refresh = () => qc.invalidateQueries({ queryKey: ["posts"] });

  if (!validId) {
    return (
      <PageError
        title="Invalid profile link"
        message="This user URL is malformed. Try searching again from the home page."
      />
    );
  }

  if (user?.id === userId) {
    return <Navigate to="/profile" replace />;
  }

  if (isLoading) {
    return <PageLoading label="Loading profile…" />;
  }

  if (isError) {
    return (
      <PageError
        title="Could not load profile"
        message={error instanceof Error ? error.message : "Unknown error"}
        onRetry={() => refetch()}
      />
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to feed
        </Link>
        <div className="glass-panel p-8 text-center text-sm text-muted-foreground">
          User not found. They may not have completed signup yet.
        </div>
      </div>
    );
  }

  const interests = normalizeInterests(profile.interests);
  const postList = asArray(posts);
  const joined = new Date(profile.created_at).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const toggleFollow = async () => {
    if (!user) return toast.error("Sign in to follow");
    setBusy(true);
    if (isFollowing) {
      const { error: delErr } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("target_type", "user")
        .eq("target_id", userId);
      if (delErr) toast.error(delErr.message);
      else refetchFollow();
    } else {
      const { error: insErr } = await supabase.from("follows").insert({
        follower_id: user.id,
        following_id: userId,
        target_type: "user",
        target_id: userId,
      });
      if (insErr) toast.error(insErr.message);
      else refetchFollow();
    }
    setBusy(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to feed
      </Link>

      <div className="glass-panel p-6">
        <div className="flex items-start gap-4">
          <UserAvatar src={profile.avatar_url} seed={profile.user_id} label={profile.display_name} size={88} />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground">
              {profile.display_name || profile.username || "Space Explorer"}
            </h1>
            <p className="text-sm text-muted-foreground">
              @{profile.username || "explorer"} · Joined {joined}
            </p>
            {profile.bio && (
              <p className="text-sm text-foreground/80 mt-2 whitespace-pre-wrap">{profile.bio.trim()}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {profile.location}
                </span>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Globe className="h-3 w-3" /> {profile.website}
                </a>
              )}
            </div>
            {interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {interests.map((i) => (
                  <span key={i} className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {i}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            {user && (
              <button
                type="button"
                onClick={toggleFollow}
                disabled={busy}
                className={`flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium ${
                  isFollowing
                    ? "border border-glass-border text-foreground hover:bg-muted/50"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
            <ConnectButton
              recipientId={userId}
              recipientName={profile.display_name || profile.username || "Space Explorer"}
              className="w-full sm:w-auto justify-center"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 text-center">
          <div className="bg-muted/30 rounded-lg py-3">
            <p className="text-lg font-bold text-foreground">{postList.length}</p>
            <p className="text-xs text-muted-foreground">Posts</p>
          </div>
          <div className="bg-muted/30 rounded-lg py-3">
            <p className="text-lg font-bold text-foreground">{stats?.followers ?? 0}</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </div>
          <div className="bg-muted/30 rounded-lg py-3">
            <p className="text-lg font-bold text-foreground">{stats?.following ?? 0}</p>
            <p className="text-xs text-muted-foreground">Following</p>
          </div>
        </div>
      </div>

      <h2 className="text-sm font-semibold text-muted-foreground px-1">Recent posts</h2>
      {postsLoading ? (
        <PageLoading label="Loading posts…" />
      ) : postsError ? (
        <PageError
          title="Could not load posts"
          message={postsErr instanceof Error ? postsErr.message : undefined}
          onRetry={() => refetchPosts()}
        />
      ) : postList.length === 0 ? (
        <div className="glass-panel p-6 text-center text-sm text-muted-foreground">No posts yet.</div>
      ) : (
        postList.map((p) => <PostCard key={p.id} post={p} onDeleted={refresh} />)
      )}
    </div>
  );
};

export default UserProfilePage;
