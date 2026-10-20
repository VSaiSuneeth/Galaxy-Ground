import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QUERY_DEFAULTS } from "@/lib/query-config";

export type LiveStatus = {
  is_something_live: boolean;
  live_event_id: string | null;
  live_event_title: string | null;
  live_event_type: string | null;
  live_event_embed_url: string | null;
  next_event_id: string | null;
  next_event_title: string | null;
  next_event_start: string | null;
  minutes_until_next: number | null;
};

export function useLiveStatus() {
  return {
    ...useQuery<LiveStatus, Error>({
      queryKey: ["liveStatus"],
      queryFn: async () => {
        const { data, error } = await supabase.rpc("get_live_status");
        if (error) throw error;
        // The RPC returns a single row
        return data[0] ?? {
          is_something_live: false,
          live_event_id: null,
          live_event_title: null,
          live_event_type: null,
          live_event_embed_url: null,
          next_event_id: null,
          next_event_title: null,
          next_event_start: null,
          minutes_until_next: null,
        };
      },
      ...QUERY_DEFAULTS,
      refetchInterval: 30000, // Poll every 30 seconds to keep live status updated
    }),
  };
}