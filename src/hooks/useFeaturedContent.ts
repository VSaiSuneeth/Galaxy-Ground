import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QUERY_DEFAULTS } from "@/lib/query-config";

export interface FeaturedContent {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  content_type: "article" | "video" | "event" | "achievement" | "spotlight";
  url?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string | null;
}

const FEATURED_CONTENT_TYPES = ["article", "video", "event", "achievement", "spotlight"] as const;

function normalizeContentType(value: string): FeaturedContent["content_type"] {
  return FEATURED_CONTENT_TYPES.find((type) => type === value) ?? "article";
}

export function useFeaturedContent() {
  return useQuery({
    queryKey: ["featured-content"],
    ...QUERY_DEFAULTS,
    queryFn: async (): Promise<FeaturedContent[]> => {
      const { data, error } = await supabase
        .from("featured_content")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []).map((item) => ({
        id: item.id,
        title: item.headline,
        description: item.summary,
        image_url: item.thumbnail_url,
        content_type: normalizeContentType(item.content_type),
        url: item.link_url,
        start_date: item.valid_from,
        end_date: item.valid_until,
        is_active: item.is_active ?? false,
        created_at: item.created_at ?? new Date(0).toISOString(),
      }));
    },
  });
}
