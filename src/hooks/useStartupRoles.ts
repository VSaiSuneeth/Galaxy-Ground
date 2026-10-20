import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QUERY_DEFAULTS } from "@/lib/query-config";

export interface StartupRole {
  id: string;
  startup_id: string;
  title: string;
  role_type: "Full-time" | "Part-time" | "Internship" | "Contract" | "Volunteer";
  work_mode: "On-site" | "Remote" | "Hybrid";
  location?: string | null;
  description?: string | null;
  apply_url: string;
  is_active: boolean;
  posted_at: string;
  expires_at?: string | null;
}

export function useStartupRoles(startupId?: string) {
  return useQuery({
    queryKey: ["startup-roles", startupId],
    enabled: !!startupId,
    ...QUERY_DEFAULTS,
    queryFn: async (): Promise<StartupRole[]> => {
      const { data, error } = await supabase
        .from("startup_roles")
        .select("*")
        .eq("startup_id", startupId!)
        .eq("is_active", true)
        .order("posted_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}