import { ChevronRight } from "lucide-react";
import type { IntelDigestItem } from "@/hooks/useIntelDashboard";

const CYAN = "hsl(190, 100%, 50%)";
const GRAY = "hsl(225, 15%, 20%)";

interface Props {
  items: IntelDigestItem[];
}

export const WhatChangedCard = ({ items }: Props) => {
  if (!items || items.length === 0) {
    return (
      <div className="glass-panel p-4 text-sm text-muted-foreground text-center">
        You're all caught up. Come back after your followed entities post something new.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <a
          key={`${item.entity_id}-${idx}`}
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 glass-panel p-3 hover:bg-muted/40 transition-colors"
          style={{ borderLeft: `3px solid ${item.priority_score >= 10 ? CYAN : GRAY}` }}
        >
          <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center text-xs">
            {item.entity_image ? (
              <img src={item.entity_image} alt="" className="h-full w-full object-cover" />
            ) : (
              "✦"
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{item.entity_name}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">{item.change_description}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </a>
      ))}
    </div>
  );
};
