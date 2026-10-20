import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { asArray } from "@/lib/safe-data";

export interface IntelDigestItem {
  entity_type: string;
  entity_id: string;
  entity_name: string;
  entity_image: string | null;
  change_description: string;
  priority_score: number;
  url: string;
}

export interface ApodEntry {
  id: number;
  title: string;
  explanation: string;
  url: string;
  thumbnail_url: string | null;
  date: string;
  cached_at: string;
}

export interface TrendingHashtag {
  hashtag: string;
  count: number;
  velocity_pct: number;
}

export interface IntelData {
  isActivated: boolean;
  followCount: number;
  digestItems: IntelDigestItem[];
  apod: ApodEntry | null;
  trending: TrendingHashtag[];
  openRoles: any[];
}

export function useIntelDashboard(): IntelData {
  const { user } = useAuth();

  const followQuery = useQuery({
    queryKey: ["intel-follow-count", user?.id],
    enabled: !!user,
    staleTime: 300_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<number> => {
      const { count } = await supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("follower_id", user!.id);
      return count ?? 0;
    },
  });

  const followCount = followQuery.data ?? 0;
  const isActivated = followCount >= 5;

  const digestQuery = useQuery({
    queryKey: ["intel-digest", user?.id],
    enabled: !!user && isActivated,
    staleTime: 300_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<IntelDigestItem[]> => {
      const { data, error } = await supabase.rpc("get_intel_digest", { p_user_id: user!.id });
      if (error) return [];
      return asArray<any>(data).map((d: any) => ({
        entity_type: d.entity_type ?? "",
        entity_id: d.entity_id ?? "",
        entity_name: d.entity_name ?? "",
        entity_image: d.entity_image ?? null,
        change_description: d.change_description ?? "",
        priority_score: d.priority_score ?? 0,
        url: d.url ?? "#",
      }));
    },
  });

  const apodQuery = useQuery({
    queryKey: ["intel-apod"],
    enabled: isActivated,
    staleTime: 300_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<ApodEntry | null> => {
      const { data, error } = await supabase
        .from("apod_cache")
        .select("*")
        .eq("id", 1)
        .single();
      if (error || !data) return null;
      return data as ApodEntry;
    },
  });

  const trendingQuery = useQuery({
    queryKey: ["intel-trending"],
    enabled: isActivated,
    staleTime: 300_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<TrendingHashtag[]> => {
      const { data, error } = await supabase.rpc("get_trending_hashtags", { p_hours: 24 });
      if (error) return [];
      return asArray<any>(data).map((d: any) => ({
        hashtag: d.hashtag ?? d.tag ?? "",
        count: d.count ?? 0,
        velocity_pct: d.velocity_pct ?? 0,
      }));
    },
  });

  const openRolesQuery = useQuery({
    queryKey: ["intel-open-roles", user?.id],
    enabled: !!user && isActivated,
    staleTime: 300_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<any[]> => {
      // First get the array of followed startup IDs (subquery via PostgrestFilterBuilder
      // is not supported in Supabase JS v2.104+ — it breaks the client's internal Set mapping).
      const { data: follows } = await supabase
        .from("follows")
        .select("target_id")
        .eq("follower_id", user!.id)
        .eq("target_type", "startup");
      const startupIds = (follows || []).map((f: any) => f.target_id).filter(Boolean) as string[];
      if (startupIds.length === 0) return [];

      const { data } = await supabase
        .from("startup_roles")
        .select("id, title, role_type, startup_id, startups!inner(slug, name, logo_url)")
        .eq("is_active", true)
        .in("startup_id", startupIds)
        .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
        .order("posted_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  return {
    isActivated,
    followCount,
    digestItems: digestQuery.data ?? [],
    apod: apodQuery.data ?? null,
    trending: trendingQuery.data ?? [],
    openRoles: openRolesQuery.data ?? [],
  };
}
