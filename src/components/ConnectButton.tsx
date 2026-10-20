import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useOwnProfile } from "@/hooks/useProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { UserPlus, MessageSquare, Clock, UserCheck } from "lucide-react";
import ConnectModal from "./ConnectModal";
import { toast } from "sonner";

interface ConnectButtonProps {
  recipientId: string;
  recipientName: string;
  className?: string;
}

export default function ConnectButton({ recipientId, recipientName, className = "" }: ConnectButtonProps) {
  const { user } = useAuth();
  const { data: ownProfile } = useOwnProfile(user);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Fetch own post count
  const { data: postCount = 0 } = useQuery({
    queryKey: ["own-post-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count || 0;
    },
  });

  // 2. Fetch daily requests count
  const { data: dailyRequestsCount = 0 } = useQuery({
    queryKey: ["own-daily-requests-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("connection_requests")
        .select("id", { count: "exact", head: true })
        .eq("requester_id", user!.id)
        .gte("created_at", yesterday);
      return count || 0;
    },
  });

  // 3. Fetch connection status
  const { data: connection, refetch: refetchStatus, isLoading } = useQuery({
    queryKey: ["connection-status", user?.id, recipientId],
    enabled: !!user && !!recipientId && user.id !== recipientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("connection_requests")
        .select("*")
        .or(`and(requester_id.eq.${user!.id},recipient_id.eq.${recipientId}),and(requester_id.eq.${recipientId},recipient_id.eq.${user!.id})`)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  if (!user) {
    return (
      <Button
        onClick={() => navigate("/auth")}
        className={`flex items-center gap-1.5 bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 ${className}`}
      >
        <UserPlus className="h-4 w-4" />
        Connect
      </Button>
    );
  }

  // Do not show button for own profile
  if (user.id === recipientId) {
    return null;
  }

  const handleConnectClick = () => {
    // Check profile completeness: must have bio + avatar + >= 1 post
    const hasBio = ownProfile?.bio && ownProfile.bio.trim().length > 0;
    const hasAvatar = ownProfile?.avatar_url && ownProfile.avatar_url.trim().length > 0;
    const isProfileComplete = hasBio && hasAvatar && postCount >= 1;

    if (!isProfileComplete) {
      toast.error("Profile Incomplete", {
        description: "You must complete your profile (add an avatar, bio, and write at least 1 post) before sending connection requests.",
      });
      return;
    }

    // Check daily rate limit: max 5 requests per day
    if (dailyRequestsCount >= 5) {
      toast.error("Limit Exceeded", {
        description: "You have sent 5 connection requests today. Try again tomorrow.",
      });
      return;
    }

    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <Button disabled className={`opacity-50 ${className}`}>
        Checking...
      </Button>
    );
  }

  // Handle various states of the connection
  if (connection) {
    if (connection.status === "accepted") {
      return (
        <>
          <Button
            onClick={() => navigate(connection.thread_id ? `/messages/${connection.thread_id}` : "/messages")}
            className={`flex items-center gap-1.5 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 ${className}`}
          >
            <MessageSquare className="h-4 w-4" />
            Message
          </Button>
        </>
      );
    }

    if (connection.status === "pending") {
      if (connection.requester_id === user.id) {
        return (
          <Button
            disabled
            className={`flex items-center gap-1.5 bg-muted/20 border border-muted-foreground/20 text-muted-foreground ${className}`}
          >
            <Clock className="h-4 w-4" />
            Pending Approval
          </Button>
        );
      } else {
        return (
          <Button
            onClick={() => navigate("/messages")}
            className={`flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 ${className}`}
          >
            <UserCheck className="h-4 w-4" />
            Respond to Request
          </Button>
        );
      }
    }

    if (connection.status === "blocked") {
      return null; // Don't show anything for blocked users
    }
  }

  // Default state: no connection
  return (
    <>
      <Button
        onClick={handleConnectClick}
        className={`flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 hover:shadow-[0_0_12px_rgba(34,211,238,0.2)] ${className}`}
      >
        <UserPlus className="h-4 w-4" />
        Connect
      </Button>

      <ConnectModal
        recipientId={recipientId}
        recipientName={recipientName}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refetchStatus}
      />
    </>
  );
}
