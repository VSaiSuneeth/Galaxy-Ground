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
      return data || [];
    },
  });
}