import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { useFollow, type FollowTarget } from "@/hooks/useFollow";

interface Props {
  targetType: FollowTarget;
  targetId?: string;
  size?: "sm" | "md";
  showCount?: boolean;
}

const FollowButton = ({ targetType, targetId, size = "md", showCount = false }: Props) => {
  const { isFollowing, busy, toggle, followers } = useFollow({ targetType, targetId });

  const sz = size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm";

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggle}
        disabled={busy || !targetId}
        className={`flex items-center gap-1.5 rounded-lg font-medium transition-colors shrink-0 ${sz} ${
          isFollowing
            ? "border border-glass-border text-foreground hover:bg-muted/50"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        } disabled:opacity-50`}
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isFollowing ? (
          <UserCheck className="h-3.5 w-3.5" />
        ) : (
          <UserPlus className="h-3.5 w-3.5" />
        )}
        {isFollowing ? "Following" : "Follow"}
      </button>
      {showCount && (
        <span className="text-xs text-muted-foreground">
          {followers} {followers === 1 ? "follower" : "followers"}
        </span>
      )}
    </div>
  );
};

export default FollowButton;
