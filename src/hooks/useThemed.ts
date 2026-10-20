import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QUERY_DEFAULTS } from "@/lib/query-config";

export interface ThemedAccount {
  id: string;
  handle: string;
  display_name: string;
  category: string;
  focus: string | null;
  style: string | null;
  vibe: string | null;
  bio: string | null;
  avatar_url: string | null;
}

export function useThemedAccounts() {
  return useQuery({
    queryKey: ["themed-accounts"],
    ...QUERY_DEFAULTS,
    queryFn: async (): Promise<ThemedAccount[]> => {
      const { data, error } = await supabase
        .from("themed_accounts")
        .select("id, handle, display_name, category, focus, style, vibe, bio, avatar_url")
        .order("category")
        .order("display_name");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useThemedAccount(handle: string) {
  return useQuery({
    queryKey: ["themed-account", handle],
    enabled: !!handle,
    ...QUERY_DEFAULTS,
    queryFn: async (): Promise<ThemedAccount | null> => {
      const { data, error } = await supabase
        .from("themed_accounts")
        .select("id, handle, display_name, category, focus, style, vibe, bio, avatar_url")
        .eq("handle", handle)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useThemedAccountPosts(accountId?: string) {
  return useQuery({
    queryKey: ["themed-posts", accountId],
    enabled: !!accountId,
    ...QUERY_DEFAULTS,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("themed_posts")
        .select("*")
        .eq("account_id", accountId!)
        .order("published_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });
}
