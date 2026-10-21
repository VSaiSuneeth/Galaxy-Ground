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

const ROLE_TYPES = ["Full-time", "Part-time", "Internship", "Contract", "Volunteer"] as const;
const WORK_MODES = ["On-site", "Remote", "Hybrid"] as const;

function isRoleType(value: string): value is StartupRole["role_type"] {
  return ROLE_TYPES.some((roleType) => roleType === value);
}

function isWorkMode(value: string): value is StartupRole["work_mode"] {
  return WORK_MODES.some((workMode) => workMode === value);
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
      return (data ?? []).flatMap((role) => {
        if (!isRoleType(role.role_type) || !isWorkMode(role.work_mode) || !role.posted_at || role.is_active === null) {
          return [];
        }

        return [{
          id: role.id,
          startup_id: role.startup_id,
          title: role.title,
          role_type: role.role_type,
          work_mode: role.work_mode,
          location: role.location,
          description: role.description,
          apply_url: role.apply_url,
          is_active: role.is_active,
          posted_at: role.posted_at,
          expires_at: role.expires_at,
        }];
      });
    },
  });
}
