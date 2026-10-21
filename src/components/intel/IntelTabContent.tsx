import { Link } from "react-router-dom";
import { useIntelDashboard } from "@/hooks/useIntelDashboard";
import { usePosts } from "@/hooks/usePosts";
import { asArray } from "@/lib/safe-data";
import { IntelActivationGate } from "@/components/intel/IntelActivationGate";
import { SpaceWeatherCard } from "@/components/intel/SpaceWeatherCard";
import { WhatChangedCard } from "@/components/intel/WhatChangedCard";
import { TrendingHashtags } from "@/components/intel/TrendingHashtags";
import { Loader2, ArrowRight } from "lucide-react";

export const IntelTabContent = () => {
  const { isActivated, followCount, digestItems, apod, trending, openRoles } = useIntelDashboard();
  const { data: followingPosts = [] } = usePosts({ mode: "following", pageSize: 10 });

  if (!isActivated) {
    return <IntelActivationGate followCount={followCount} />;
  }

  const networkPosts = asArray(followingPosts).filter(
    (p) => (p.likes_count ?? 0) >= 3 || p.source === "startup" || p.source === "themed",
  );

  const topTrending = trending.length > 0 ? trending[0] : null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
        <span className="text-primary">✦</span> Intel Dashboard
      </h2>

      {/* Space Weather */}
      {apod && (
        <SpaceWeatherCard
          apod={apod}
          nextLaunch={null}
          discoveryOfDay={null}
          topTrending={topTrending}
        />
      )}

      {/* Trending Hashtags */}
      {trending.length > 0 && (
        <div className="glass-panel p-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Trending Now
          </h3>
          <TrendingHashtags items={trending} />
        </div>
      )}

      {/* What Changed */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">What Changed</h3>
        <WhatChangedCard items={digestItems} />
      </div>

      {/* From Your Network */}
      {networkPosts.length > 0 && (
        <div className="glass-panel p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">From Your Network</h3>
          <div className="space-y-2">
            {networkPosts.slice(0, 5).map((post) => (
              <Link
                key={post.id}
                to={`/post/${post.id}`}
                className="block text-sm text-foreground/90 hover:text-primary transition-colors line-clamp-2"
              >
                {post.content}
              </Link>
            ))}
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-3"
          >
            See all in Following → <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Open Roles */}
      {openRoles.length > 0 && (
        <div className="glass-panel p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Open Roles</h3>
          <div className="space-y-2">
            {openRoles.slice(0, 3).map((role) => (
              <Link
                key={role.id}
                to={`/startup/${role.startups?.slug || ""}#open-roles`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-muted overflow-hidden shrink-0 flex items-center justify-center text-[10px]">
                  {role.startups?.logo_url ? (
                    <img src={role.startups.logo_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    role.startups?.name?.[0] || "R"
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground truncate font-medium">{role.title}</p>
                  <p className="text-xs text-muted-foreground">{role.startups?.name}</p>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                  {role.role_type}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
          <Link
            to="/startups"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-3"
          >
            See all roles → <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
};
