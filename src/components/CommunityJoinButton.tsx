import { Loader2, UserCheck, UserPlus } from "lucide-react";
import { useCommunityMembership } from "@/hooks/useCommunityMembership";

interface Props {
  slug: string;
  size?: "sm" | "md";
  showCount?: boolean;
}

const CommunityJoinButton = ({ slug, size = "md", showCount = true }: Props) => {
  const { isMember, memberCount, busy, toggle, supported } = useCommunityMembership(slug);
  const sz = size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm";

  if (!supported) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggle}
        disabled={busy}
        className={`flex items-center gap-1.5 rounded-lg font-medium transition-colors shrink-0 ${sz} ${
          isMember
            ? "border border-glass-border text-foreground hover:bg-muted/50"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        } disabled:opacity-50`}
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isMember ? (
          <UserCheck className="h-3.5 w-3.5" />
        ) : (
          <UserPlus className="h-3.5 w-3.5" />
        )}
        {isMember ? "Joined" : "Join orbit"}
      </button>
      {showCount && (
        <span className="text-xs text-muted-foreground">
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </span>
      )}
    </div>
  );
};

export default CommunityJoinButton;
