import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type FollowTarget = "user" | "startup" | "themed";

interface Args {
  targetType: FollowTarget;
  targetId?: string;
}

/**
 * Polymorphic follow hook. Works for users, startups, and themed accounts.
 * Stores rows in `follows` (target_type, target_id). For user follows we
 * also fill the legacy `following_id` so old queries keep working.
 */
export function useFollow({ targetType, targetId }: Args) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!targetId) return;
    const [countRes, mineRes] = await Promise.all([
      supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("target_type", targetType)
        .eq("target_id", targetId),
      user
        ? supabase
            .from("follows")
            .select("id")
            .eq("follower_id", user.id)
            .eq("target_type", targetType)
            .eq("target_id", targetId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    setFollowers(countRes.count || 0);
    setIsFollowing(!!(mineRes as any).data);
    setLoaded(true);
  }, [targetType, targetId, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = async () => {
    if (!user) {
      toast.error("Sign in to follow");
      return;
    }
    if (!targetId) return;
    setBusy(true);
    if (isFollowing) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("target_type", targetType)
        .eq("target_id", targetId);
      if (error) toast.error(error.message);
      else {
        setIsFollowing(false);
        setFollowers((n) => Math.max(0, n - 1));
      }
    } else {
      const payload: any = {
        follower_id: user.id,
        target_type: targetType,
        target_id: targetId,
      };
      // Keep legacy column populated for user follows so existing queries keep working.
      if (targetType === "user") payload.following_id = targetId;
      const { error } = await supabase.from("follows").insert(payload);
      if (error) toast.error(error.message);
      else {
        setIsFollowing(true);
        setFollowers((n) => n + 1);
      }
    }
    setBusy(false);
  };

  return { isFollowing, followers, busy, toggle, loaded, refresh };
}
