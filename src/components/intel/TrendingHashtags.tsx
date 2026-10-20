import { Link } from "react-router-dom";
import type { TrendingHashtag } from "@/hooks/useIntelDashboard";

interface Props {
  items: TrendingHashtag[];
}

export const TrendingHashtags = ({ items }: Props) => {
  if (!items || items.length === 0) return null;

  return (
    <div
      className="flex gap-2 overflow-x-auto py-1"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {items.map((h) => (
        <Link
          key={h.hashtag}
          to={`/hashtag/${h.hashtag}`}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50`}
          style={
            h.velocity_pct >= 200
              ? { boxShadow: "0 0 8px rgba(34,197,94,0.4)" }
              : undefined
          }
        >
          #{h.hashtag}
          {h.velocity_pct >= 100 && (
            <span className="text-[10px] px-1 rounded bg-green-500 text-white font-medium">
              ↑{h.velocity_pct}%
            </span>
          )}
        </Link>
      ))}
    </div>
  );
};
