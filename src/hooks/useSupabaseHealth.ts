import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getSupabaseEnv } from "@/lib/supabase-env";

export type SupabaseHealth = {
  ok: boolean;
  envMissing: string[];
  connectionError: string | null;
  counts: Record<string, number | null>;
  tableErrors: Record<string, string>;
  tableWarnings: Record<string, string>;
  totalContent: number;
};

/** Tables checked without auth (public SELECT policies). */
const PUBLIC_TABLES = [
  "profiles",
  "posts",
  "startup_posts",
  "themed_posts",
  "startups",
  "themed_accounts",
  "comments",
  "likes",
  "follows",
  "notifications",
  "aggregate_reactions",
] as const;

/** Requires signed-in user due to RLS — not a schema failure when empty. */
export function useSupabaseHealth() {
  return useQuery({
    queryKey: ["supabase-health"],
    staleTime: 60_000,
    retry: 1,
    queryFn: async (): Promise<SupabaseHealth> => {
      const { missing } = getSupabaseEnv();
      if (missing.length) {
        return {
          ok: false,
          envMissing: missing,
          connectionError: `Missing: ${missing.join(", ")}`,
          counts: {},
          tableErrors: {},
          tableWarnings: {},
          totalContent: 0,
        };
      }

      const counts: Record<string, number | null> = {};
      const tableErrors: Record<string, string> = {};
      const tableWarnings: Record<string, string> = {};
      let connectionError: string | null = null;

      for (const table of PUBLIC_TABLES) {
        const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
        if (error) {
          const msg = error.message || error.code || "Unknown error";
          if (msg.includes("fetch") || error.code === "") connectionError = msg;
          else if (msg.includes("does not exist") || msg.includes("schema cache")) {
            tableErrors[table] = msg;
          } else {
            tableWarnings[table] = msg;
          }
          counts[table] = null;
        } else {
          counts[table] = count ?? 0;
        }
      }

      counts.bookmarks = null;

      const totalContent =
        (counts.posts ?? 0) + (counts.startup_posts ?? 0) + (counts.themed_posts ?? 0);
      const hasSchemaErrors = Object.keys(tableErrors).length > 0;
      const ok = !hasSchemaErrors && !connectionError;

      return {
        ok,
        envMissing: [],
        connectionError:
          connectionError ??
          (hasSchemaErrors ? "Some tables are missing. Run supabase db push." : null),
        counts,
        tableErrors,
        tableWarnings,
        totalContent,
      };
    },
  });
}
