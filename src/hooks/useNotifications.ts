import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { asArray, logDataIssue } from "@/lib/safe-data";
import { QUERY_DEFAULTS } from "@/lib/query-config";

export interface AppNotification {
  id: string;
  user_id: string;
  kind: string;
  account_type: string;
  account_id: string;
  account_name: string | null;
  account_handle: string | null;
  post_type: string | null;
  post_id: string | null;
  title: string | null;
  preview: string | null;
  image_url: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    ...QUERY_DEFAULTS,
    queryFn: async (): Promise<AppNotification[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) {
        logDataIssue("useNotifications: notifications select failed", error);
        return [];
      }
      return asArray<AppNotification>(data);
    },
  });

  // Realtime: refresh on insert
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("notif-" + user.id)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["notifications", user.id] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);

  const list = asArray(query.data);
  const unread = list.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    qc.invalidateQueries({ queryKey: ["notifications", user.id] });
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
  };

  return { ...query, data: list, unread, markAllRead, markRead };
}
