import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { QUERY_DEFAULTS } from "@/lib/query-config";

export interface ConnectionRequest {
  id: string;
  requester_id: string;
  recipient_id: string;
  intent_category: string;
  context_message: string;
  status: "pending" | "accepted" | "declined" | "blocked";
  thread_id: string | null;
  created_at: string;
  responded_at: string | null;
  sender_profile?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  recipient_profile?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface MessageThread {
  id: string;
  participant_a: string;
  participant_b: string;
  created_at: string;
  last_message_at: string;
  participant_a_unread: number;
  participant_b_unread: number;
  other_participant?: {
    user_id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    show_online_status: boolean;
    last_seen_at: string | null;
  };
}

export interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  media_url: string | null;
  media_type: "image" | null;
  read_at: string | null;
  created_at: string;
}

// 1. Hook to fetch incoming pending requests
export function useConnectionRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["connection-requests", "incoming", user?.id],
    enabled: !!user,
    ...QUERY_DEFAULTS,
    queryFn: async (): Promise<ConnectionRequest[]> => {
      const { data, error } = await supabase
        .from("connection_requests")
        .select(`
          *,
          sender_profile:profiles!connection_requests_requester_id_fkey(username, display_name, avatar_url)
        `)
        .eq("recipient_id", user!.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ConnectionRequest[];
    },
  });
}

// 2. Hook to fetch sent requests
export function useSentRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["connection-requests", "sent", user?.id],
    enabled: !!user,
    ...QUERY_DEFAULTS,
    queryFn: async (): Promise<ConnectionRequest[]> => {
      const { data, error } = await supabase
        .from("connection_requests")
        .select(`
          *,
          recipient_profile:profiles!connection_requests_recipient_id_fkey(username, display_name, avatar_url)
        `)
        .eq("requester_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ConnectionRequest[];
    },
  });
}

// 3. Hook to fetch active threads
export function useActiveThreads() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["threads", user?.id],
    enabled: !!user,
    ...QUERY_DEFAULTS,
    queryFn: async (): Promise<MessageThread[]> => {
      const { data, error } = await supabase
        .from("message_threads")
        .select(`
          *,
          profile_a:profiles!message_threads_participant_a_fkey(user_id, username, display_name, avatar_url, show_online_status, last_seen_at),
          profile_b:profiles!message_threads_participant_b_fkey(user_id, username, display_name, avatar_url, show_online_status, last_seen_at)
        `)
        .or(`participant_a.eq.${user!.id},participant_b.eq.${user!.id}`)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((thread) => {
        const otherProfile = thread.participant_a === user!.id ? thread.profile_b : thread.profile_a;
        return {
          id: thread.id,
          participant_a: thread.participant_a,
          participant_b: thread.participant_b,
          created_at: thread.created_at,
          last_message_at: thread.last_message_at,
          participant_a_unread: thread.participant_a_unread,
          participant_b_unread: thread.participant_b_unread,
          other_participant: otherProfile ? {
            user_id: otherProfile.user_id,
            username: otherProfile.username,
            display_name: otherProfile.display_name,
            avatar_url: otherProfile.avatar_url,
            show_online_status: !!otherProfile.show_online_status,
            last_seen_at: otherProfile.last_seen_at,
          } : undefined,
        };
      });
    },
  });
}

// 4. Hook to fetch thread messages with realtime subscription
export function useThreadMessages(threadId?: string) {
  const qc = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["messages", threadId],
    enabled: !!threadId && !!user,
    ...QUERY_DEFAULTS,
    queryFn: async (): Promise<Message[]> => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("thread_id", threadId!)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as Message[];
    },
  });

  // Setup realtime listener
  useEffect(() => {
    if (!threadId || !user) return;

    const channel = supabase
      .channel(`room:${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${threadId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["messages", threadId] });
          qc.invalidateQueries({ queryKey: ["threads", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, user, qc]);

  return query;
}

// 5. Hook to send connection request
export function useSendConnectionRequest() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: { recipientId: string; category: string; message: string }) => {
      if (!user) throw new Error("Authentication required.");

      const { data, error } = await supabase
        .from("connection_requests")
        .insert({
          requester_id: user.id,
          recipient_id: payload.recipientId,
          intent_category: payload.category,
          context_message: payload.message,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("You already sent this person a request.");
        }
        if (error.code === "42501" || /rate limit|5 requests/i.test(error.message)) {
          throw new Error("You have sent 5 connection requests today. Try again tomorrow.");
        }
        if (/block/i.test(error.message)) {
          throw new Error("You cannot send a connection request because one of you has blocked the other.");
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["connection-requests", "sent", user?.id] });
    },
  });
}

// 6. Hook to respond to connection request
export function useRespondConnectionRequest() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: { requestId: string; action: "accepted" | "declined" | "blocked" }) => {
      if (!user) throw new Error("Authentication required.");

      if (payload.action === "accepted") {
        // Run database RPC atomically to accept and create thread
        const { data, error } = await supabase.rpc("accept_connection_rpc", {
          p_request_id: payload.requestId,
        });
        if (error) throw error;
        return { thread_id: data };
      } else if (payload.action === "declined") {
        const { data, error } = await supabase
          .from("connection_requests")
          .update({ status: "declined", responded_at: new Date().toISOString() })
          .eq("id", payload.requestId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        // Block action
        const { data: request } = await supabase
          .from("connection_requests")
          .select("requester_id")
          .eq("id", payload.requestId)
          .single();

        if (request) {
          const { error: blockError } = await supabase.rpc("block_user_rpc", {
            p_blocked_id: request.requester_id,
          });
          if (blockError) throw blockError;
        }
        return { blocked: true };
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["connection-requests", "incoming", user?.id] });
      qc.invalidateQueries({ queryKey: ["threads", user?.id] });
    },
  });
}

// 7. Hook to send message
export function useSendMessage() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: { threadId: string; content: string }) => {
      if (!user) throw new Error("Authentication required.");

      const { data, error } = await supabase
        .from("messages")
        .insert({
          thread_id: payload.threadId,
          sender_id: user.id,
          content: payload.content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["messages", variables.threadId] });
      qc.invalidateQueries({ queryKey: ["threads", user?.id] });
    },
  });
}

// 8. Hook to mark thread as read
export function useMarkThreadRead() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (threadId: string) => {
      if (!user) return;
      const { error } = await supabase.rpc("mark_thread_read", {
        p_thread_id: threadId,
        p_user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: (_, threadId) => {
      qc.invalidateQueries({ queryKey: ["messages", threadId] });
      qc.invalidateQueries({ queryKey: ["threads", user?.id] });
    },
  });
}

// 9. Hook to block a user from within chat thread
export function useBlockUser() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (blockedId: string) => {
      if (!user) throw new Error("Authentication required.");
      const { error } = await supabase.rpc("block_user_rpc", {
        p_blocked_id: blockedId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["threads", user?.id] });
      qc.invalidateQueries({ queryKey: ["connection-requests", "incoming", user?.id] });
    },
  });
}

// 10. Hook to get user messaging settings/privacy details
export function useMessagingSettings(userId?: string) {
  return useQuery({
    queryKey: ["messaging-settings", userId],
    enabled: !!userId,
    ...QUERY_DEFAULTS,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("messaging_open_to, messaging_allowed_categories, show_online_status, require_complete_profile_to_message")
        .eq("user_id", userId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

// 11. Mutation to update messaging privacy settings
export function useUpdateMessagingSettings() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (settings: {
      messaging_open_to?: "everyone" | "followers" | "nobody";
      messaging_allowed_categories?: string[];
      show_online_status?: boolean;
      require_complete_profile_to_message?: boolean;
    }) => {
      if (!user) throw new Error("Authentication required.");
      const { data, error } = await supabase
        .from("profiles")
        .update(settings)
        .eq("user_id", user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messaging-settings", user?.id] });
      qc.invalidateQueries({ queryKey: ["own-profile", user?.id] });
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
}

// 12. Hook to update online status (called inside AppLayout or similar at interval)
export function useUpdateOnlineStatus() {
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      
      // First check if they have online status enabled
      const { data: profile } = await supabase
        .from("profiles")
        .select("show_online_status")
        .eq("user_id", user.id)
        .single();

      if (profile?.show_online_status) {
        await supabase
          .from("profiles")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("user_id", user.id);
      }
    }
  });
}

// 13. Hook to get unread threads count
export function useUnreadMessagesCount() {
  const { data: threads = [] } = useActiveThreads();
  const { user } = useAuth();

  return threads.reduce((acc, t) => {
    if (!user) return 0;
    const isParticipantA = t.participant_a === user.id;
    return acc + (isParticipantA ? t.participant_a_unread : t.participant_b_unread);
  }, 0);
}
