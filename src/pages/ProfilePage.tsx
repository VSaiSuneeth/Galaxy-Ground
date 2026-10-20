import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Edit2, Save, X, LogOut, Shield, Loader2, Badge } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
import { usePosts } from "@/hooks/usePosts";
import { useQueryClient } from "@tanstack/react-query";
import { avatarEmoji } from "@/lib/post-utils";
import { useOwnProfile, useProfileStats } from "@/hooks/useProfile";
import { PageError, PageLoading } from "@/components/PageState";
import type { ProfileRow } from "@/lib/profile-utils";
import { asArray, normalizeInterests } from "@/lib/safe-data";
import { useUserBadges } from "@/hooks/useUserBadges";

const ProfilePage = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<ProfileRow> & { interestsText?: string }>({});

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    error: profileErr,
    refetch: refetchProfile,
  } = useOwnProfile(user);

  const { data: stats } = useProfileStats(user?.id);

  const {
    data: posts,
    isLoading: postsLoading,
    isError: postsError,
    error: postsErr,
    refetch: refetchPosts,
  } = usePosts({ userId: user?.id, enabled: !!user?.id });

  const { data: badges = [], isLoading: badgesLoading } = useUserBadges(user?.id);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["posts"] });
    qc.invalidateQueries({ queryKey: ["own-profile"] });
    qc.invalidateQueries({ queryKey: ["user-badges"] });
  };

  const interests = normalizeInterests(profile?.interests);
  const postList = asArray(posts);

  useEffect(() => {
    if (profile) {
      setForm({
        ...profile,
        interestsText: normalizeInterests(profile.interests).join(", "),
      });
    }
  }, [profile]);

  if (authLoading || (user && profileLoading)) {
    return <PageLoading label="Loading your profile…" />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (profileError) {
    return (
      <PageError
        title="Could not load profile"
        message={profileErr instanceof Error ? profileErr.message : "Unknown error"}
        onRetry={() => refetchProfile()}
      />
    );
  }

  const joined = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : "";

  const handleSave = async () => {
    const interests = (form.interestsText || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const { error } = await supabase
      .from("profiles")
      .update({
        username: form.username || null,
        display_name: form.display_name || null,
        bio: form.bio || null,
        location: form.location || null,
        website: form.website || null,
        avatar_url: form.avatar_url || null,
        interests,
      })
      .eq("user_id", user.id);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated 🚀");
    setEditing(false);
    refetchProfile();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="glass-panel p-6">
        <div className="flex items-start gap-4">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-4xl shrink-0 overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              avatarEmoji(user.id)
            )}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2">
                <input
                  value={form.display_name || ""}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                  placeholder="Display name"
                  className="w-full bg-muted/30 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
                <input
                  value={form.username || ""}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="Username"
                  className="w-full bg-muted/30 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
                <textarea
                  value={form.bio || ""}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Bio"
                  rows={2}
                  className="w-full bg-muted/30 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={form.location || ""}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Location"
                    className="bg-muted/30 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                  <input
                    value={form.website || ""}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    placeholder="Website"
                    className="bg-muted/30 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
                <input
                  value={form.avatar_url || ""}
                  onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                  placeholder="Avatar image URL"
                  className="w-full bg-muted/30 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
                <input
                  value={form.interestsText || ""}
                  onChange={(e) => setForm({ ...form, interestsText: e.target.value })}
                  placeholder="Interests (comma separated)"
                  className="w-full bg-muted/30 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>
            ) : (
              <>
                <h1 className="text-xl font-bold text-foreground">
                  {profile?.display_name || profile?.username || "Space Explorer"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  @{profile?.username || "explorer"}
                  {joined ? ` · Joined ${joined}` : ""}
                </p>
                {profile?.bio && (
                  <p className="text-sm text-foreground/80 mt-2 whitespace-pre-wrap">{profile.bio.trim()}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                  {profile?.location && <span>📍 {profile.location}</span>}
                  {profile?.website && (
                    <a href={profile.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      🔗 {profile.website}
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
              </>
            )}
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    if (profile) {
                      setForm({
                        ...profile,
                        interestsText: normalizeInterests(profile.interests).join(", "),
                      });
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground border border-glass-border hover:bg-muted/50"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground border border-glass-border hover:bg-muted/50 w-full"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit
                </button>
                <Link
                  to="/settings/messaging"
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground border border-glass-border hover:bg-muted/50 w-full"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Privacy
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 text-center">
          <Stat label="Posts" value={postList.length} />
          <Stat label="Followers" value={stats?.followers ?? 0} />
          <Stat label="Following" value={stats?.following ?? 0} />
        </div>

        {/* Badges Section */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3 text-foreground">Achievements</h2>
          {badgesLoading ? (
            <div className="flex h-20 items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : badges.length === 0 ? (
            <p className="text-sm text-muted-foreground">No badges earned yet.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {badges.map((badge) => (
                <div key={badge.id} className="flex flex-col items-center text-center">
                  {badge.badge.image_url ? (
                    <img
                      src={badge.badge.image_url}
                      alt={badge.badge.name}
                      className="w-16 h-16 object-contain rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-muted/30 flex items-center justify-center rounded">
                      <Badge className="h-8 w-8 text-secondary" />
                    </div>
                  )}
                  <p className="mt-1 text-xs text-foreground/80">{badge.badge.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-glass-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Signed in as {user.email}</span>
          <button type="button" onClick={signOut} className="flex items-center gap-1 hover:text-destructive">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </div>

      <CreatePost onCreated={refresh} />

      <h2 className="text-sm font-semibold text-muted-foreground px-1">Your posts</h2>
      {postsLoading ? (
        <PageLoading label="Loading posts…" />
      ) : postsError ? (
        <PageError
          title="Could not load posts"
          message={postsErr instanceof Error ? postsErr.message : undefined}
          onRetry={() => refetchPosts()}
        />
      ) : postList.length === 0 ? (
        <div className="glass-panel p-6 text-center text-sm text-muted-foreground">
          You haven't posted yet. Share your first cosmic thought above ☄️
        </div>
      ) : (
        postList.map((p) => <PostCard key={p.id} post={p} onDeleted={refresh} />)
      )}
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="bg-muted/30 rounded-lg py-3">
    <p className="text-lg font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

export default ProfilePage;