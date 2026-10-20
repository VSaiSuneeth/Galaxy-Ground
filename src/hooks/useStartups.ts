import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QUERY_DEFAULTS } from "@/lib/query-config";

export interface Startup {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  hq: string | null;
  founded: string | null;
  twitter_handle: string | null;
}

export interface StartupPost {
  id: string;
  startup_id: string;
  title: string | null;
  content: string;
  summary: string | null;
  source_url: string;
  source_type: string;
  image_url: string | null;
  hashtags: string[] | null;
  published_at: string;
  views_count: number;
  likes_count: number;
}

export function useStartups() {
  return useQuery({
    queryKey: ["startups"],
    ...QUERY_DEFAULTS,
    queryFn: async (): Promise<Startup[]> => {
      const { data, error } = await supabase
        .from("startups")
        .select("id, slug, name, category, description, website, logo_url, hq, founded, twitter_handle")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useStartup(slug: string) {
  return useQuery({
    queryKey: ["startup", slug],
    enabled: !!slug,
    ...QUERY_DEFAULTS,
    queryFn: async (): Promise<Startup | null> => {
      const { data, error } = await supabase
        .from("startups")
        .select("id, slug, name, category, description, website, logo_url, hq, founded, twitter_handle")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useStartupPosts(startupId?: string) {
  return useQuery({
    queryKey: ["startup-posts", startupId],
    enabled: !!startupId,
    ...QUERY_DEFAULTS,
    queryFn: async (): Promise<StartupPost[]> => {
      const { data, error } = await supabase
        .from("startup_posts")
        .select("*")
        .eq("startup_id", startupId!)
        .order("published_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useStartupSearch(query: string) {
  return useQuery({
    queryKey: ["startup-search", query],
    enabled: query.trim().length >= 2,
    ...QUERY_DEFAULTS,
    queryFn: async (): Promise<Startup[]> => {
      const { data, error } = await supabase
        .from("startups")
        .select("id, slug, name, category, description, website, logo_url, hq, founded, twitter_handle")
        .ilike("name", `%${query}%`)
        .limit(8);
      if (error) throw error;
      return data || [];
    },
  });
}
