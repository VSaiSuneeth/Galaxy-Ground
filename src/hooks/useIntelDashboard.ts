import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { asArray } from "@/lib/safe-data";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function numberValue(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

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
  explanation: string | null;
  url: string;
  thumbnail_url: string | null;
  date: string;
  media_type: string | null;
  updated_at: string | null;
}

export interface TrendingHashtag {
  hashtag: string;
  count: number;
  velocity_pct: number;
}

export interface IntelOpenRole {
  id: string;
  title: string;
  role_type: string;
  startup_id: string;
  startups: {
    slug: string;
    name: string;
    logo_url: string | null;
  } | null;
}

export interface IntelData {
  isActivated: boolean;
  followCount: number;
  digestItems: IntelDigestItem[];
  apod: ApodEntry | null;
  trending: TrendingHashtag[];
  openRoles: IntelOpenRole[];
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
      return asArray<unknown>(data).flatMap((value) => {
        const item = asRecord(value);
        if (!item) return [];
        return [{
          entity_type: stringValue(item.entity_type),
          entity_id: stringValue(item.entity_id),
          entity_name: stringValue(item.entity_name),
          entity_image: typeof item.entity_image === "string" ? item.entity_image : null,
          change_description: stringValue(item.change_description),
          priority_score: numberValue(item.priority_score),
          url: stringValue(item.url, "#"),
        }];
      });
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
      return data;
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
      return asArray<unknown>(data).flatMap((value) => {
        const item = asRecord(value);
        if (!item) return [];
        return [{
          hashtag: stringValue(item.hashtag, stringValue(item.tag)),
          count: numberValue(item.count),
          velocity_pct: numberValue(item.velocity_pct),
        }];
      });
    },
  });

  const openRolesQuery = useQuery({
    queryKey: ["intel-open-roles", user?.id],
    enabled: !!user && isActivated,
    staleTime: 300_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<IntelOpenRole[]> => {
      // First get the array of followed startup IDs (subquery via PostgrestFilterBuilder
      // is not supported in Supabase JS v2.104+ — it breaks the client's internal Set mapping).
      const { data: follows } = await supabase
        .from("follows")
        .select("target_id")
        .eq("follower_id", user!.id)
        .eq("target_type", "startup");
      const startupIds = (follows ?? []).flatMap((follow) => follow.target_id ? [follow.target_id] : []);
      if (startupIds.length === 0) return [];

      const { data } = await supabase
        .from("startup_roles")
        .select("id, title, role_type, startup_id, startups!inner(slug, name, logo_url)")
        .eq("is_active", true)
        .in("startup_id", startupIds)
        .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
        .order("posted_at", { ascending: false })
        .limit(5);
      return (data ?? []).flatMap((role) => {
        const startup = Array.isArray(role.startups) ? role.startups[0] : role.startups;
        if (!startup) return [];
        return [{
          id: role.id,
          title: role.title,
          role_type: role.role_type,
          startup_id: role.startup_id,
          startups: {
            slug: startup.slug,
            name: startup.name,
            logo_url: startup.logo_url,
          },
        }];
      });
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
