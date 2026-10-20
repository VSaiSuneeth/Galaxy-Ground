import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || (error.message || "").toLowerCase().includes("does not exist");
}

async function resolveCommunityId(slug: string): Promise<string | null> {
  const { data, error } = await supabase.from("communities").select("id").eq("slug", slug).maybeSingle();
  if (error) {
    if (isMissingTableError(error)) return null;
    throw error;
  }
  return data?.id ?? null;
}

export function useCommunityMembershipCounts() {
  return useQuery({
    queryKey: ["community-membership-counts"],
    queryFn: async (): Promise<Map<string, number>> => {
      const { data, error } = await supabase
        .from("community_memberships")
        .select("community_id, communities(slug)");

      if (error) {
        if (isMissingTableError(error)) return new Map();
        throw error;
      }

      const counts = new Map<string, number>();
      for (const row of data || []) {
        const slug = (row as { communities?: { slug?: string } }).communities?.slug;
        if (!slug) continue;
        counts.set(slug, (counts.get(slug) || 0) + 1);
      }
      return counts;
    },
    staleTime: 30_000,
  });
}

export function useCommunityMembership(slug: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [supported, setSupported] = useState(true);

  const refresh = useCallback(async () => {
    const id = await resolveCommunityId(slug);
    if (!id) {
      setSupported(false);
      setCommunityId(null);
      setIsMember(false);
      setMemberCount(0);
      return;
    }

    setSupported(true);
    setCommunityId(id);

    const countRes = await supabase
      .from("community_memberships")
      .select("id", { count: "exact", head: true })
      .eq("community_id", id);

    if (countRes.error && !isMissingTableError(countRes.error)) throw countRes.error;
    setMemberCount(countRes.count || 0);

    if (!user) {
      setIsMember(false);
      return;
    }

    const mineRes = await supabase
      .from("community_memberships")
      .select("id")
      .eq("community_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (mineRes.error && !isMissingTableError(mineRes.error)) throw mineRes.error;
    setIsMember(!!mineRes.data);
  }, [slug, user]);

  useEffect(() => {
    refresh().catch((error) => {
      console.warn("Community membership refresh failed", error);
      setSupported(false);
      setCommunityId(null);
      setIsMember(false);
      setMemberCount(0);
    });
  }, [refresh]);

  const toggle = async () => {
    if (!supported || !communityId) {
      toast.error("Community membership is not available yet");
      return;
    }
    if (!user) {
      toast.error("Sign in to join this orbit");
      return;
    }

    setBusy(true);
    try {
      if (isMember) {
        const { error } = await supabase
          .from("community_memberships")
          .delete()
          .eq("community_id", communityId)
          .eq("user_id", user.id);
        if (error) toast.error(error.message);
        else {
          setIsMember(false);
          setMemberCount((n) => Math.max(0, n - 1));
          queryClient.invalidateQueries({ queryKey: ["community-membership-counts"] });
          queryClient.invalidateQueries({ queryKey: ["communities-stats"] });
        }
      } else {
        const { error } = await supabase.from("community_memberships").insert({
          community_id: communityId,
          user_id: user.id,
        });
        if (error) toast.error(error.message);
        else {
          setIsMember(true);
          setMemberCount((n) => n + 1);
          queryClient.invalidateQueries({ queryKey: ["community-membership-counts"] });
          queryClient.invalidateQueries({ queryKey: ["communities-stats"] });
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return { isMember, memberCount, busy, toggle, supported, communityId };
}
