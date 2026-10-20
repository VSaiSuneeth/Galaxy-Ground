import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QUERY_DEFAULTS } from "@/lib/query-config";

export interface Badge {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  criteria?: string | null;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string;
  badge: Badge;
}

export function useUserBadges(userId?: string) {
  return useQuery({
    queryKey: ["user-badges", userId],
    enabled: !!userId,
    ...QUERY_DEFAULTS,
    queryFn: async (): Promise<UserBadge[]> => {
      const { data, error } = await supabase
        .from("profile_badge_awards")
        .select(`
          id,
          user_id,
          badge_id,
          awarded_at,
          badge:badge_id (
            id,
            name,
            description,
            image_url,
            criteria
          )
        `)
        .eq("user_id", userId!)
        .order("awarded_at", { ascending: false });

      if (error) throw error;
      return (data as UserBadge[]) || [];
    },
  });
}