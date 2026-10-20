import { Briefcase, TrendingUp, Users, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useFollow } from "@/hooks/useFollow";
import { useSidebarStats } from "@/hooks/useSidebarStats";
import { useTrendingHashtags } from "@/hooks/useTrendingHashtags";
import { useWhoToFollow } from "@/hooks/useWhoToFollow";
import { useFeaturedContent } from "@/hooks/useFeaturedContent";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { asArray } from "@/lib/safe-data";
import LaunchCountdownWidget from "@/components/LaunchCountdownWidget";

const fallbackTrending = [
  { tag: "isro", count: 0 },
  { tag: "rocket", count: 0 },
  { tag: "satellite", count: 0 },
  { tag: "launch", count: 0 },
  { tag: "mars", count: 0 },
];

const FollowChip = ({ startupId }: { startupId: string }) => {
  const { isFollowing, busy, toggle } = useFollow({ targetType: "startup", targetId: startupId });
  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
        isFollowing
          ? "border border-glass-border text-foreground hover:bg-muted/40"
          : "bg-primary text-primary-foreground hover:bg-primary/90"
      }`}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
};

const RightSidebar = () => {
  const { user } = useAuth();
  const { data: trending } = useTrendingHashtags(6);
  const { data: stats } = useSidebarStats();
  const { data: whoToFollow = [], isLoading: whoLoading } = useWhoToFollow(3);
  const { data: featuredContent = [] } = useFeaturedContent();
  const topics = asArray(trending).length > 0 ? asArray(trending) : fallbackTrending;
  const popularCommunities = asArray(stats?.communities).slice(0, 4);
  const topStartups = asArray(stats?.topStartups);
  const [followedRoles, setFollowedRoles] = useState<any[]>([]);

  // Filter for India in Space spotlight content
  const indiaInSpace = featuredContent.find(
    (item) => item.content_type === "spotlight" && item.title.toLowerCase().includes("india")
  );

  // Roles at startups you follow
  useEffect(() => {
    if (!user) { setFollowedRoles([]); return; }
    // First get the array of followed startup IDs (subquery via PostgrestFilterBuilder
    // is not supported in Supabase JS v2.104+ — it breaks the client's internal Set mapping).
    supabase
      .from("follows")
      .select("target_id")
      .eq("follower_id", user.id)
      .eq("target_type", "startup")
      .then(({ data: follows }) => {
        const startupIds = (follows || []).map((f: any) => f.target_id).filter(Boolean) as string[];
        if (startupIds.length === 0) { setFollowedRoles([]); return; }
        supabase
          .from("startup_roles")
          .select("id, title, role_type, startup_id, startups!inner(slug, name, logo_url)")
          .eq("is_active", true)
          .in("startup_id", startupIds)
          .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
          .order("posted_at", { ascending: false })
          .limit(3)
          .then(({ data }) => setFollowedRoles(data || []))
          .catch(() => setFollowedRoles([]));
      })
      .catch(() => setFollowedRoles([]));
  }, [user]);

  return (
    <aside className="hidden xl:block w-80 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto scrollbar-thin py-4 pr-4 space-y-4">
      <section className="glass-panel p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <TrendingUp className="h-4 w-4 text-primary" />
          Trending Topics
        </h3>
        <ul className="space-y-1">
          {topics.map((topic) => (
            <li key={topic.tag}>
              <Link
                to={`/hashtag/${topic.tag}`}
                className="flex justify-between items-center text-sm hover:bg-muted/40 rounded-lg px-2 py-1.5 transition-colors"
              >
                <span className="text-primary font-medium">#{topic.tag}</span>
                <span className="text-muted-foreground text-xs tabular-nums">{topic.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <LaunchCountdownWidget compact />

      {/* India in Space Spotlight */}
      {indiaInSpace && (
        <section className="glass-panel p-4 border-primary/30 bg-primary/5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            India in Space
          </h3>
          {indiaInSpace.image_url && (
            <img
              src={indiaInSpace.image_url}
              alt={indiaInSpace.title}
              className="w-full h-32 object-cover rounded-lg mb-3"
            />
          )}
          <p className="text-xs text-foreground/80 line-clamp-2 mb-2">{indiaInSpace.description}</p>
          {indiaInSpace.url && (
            <a
              href={indiaInSpace.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Read more <ArrowRight className="h-3 w-3" />
            </a>
          )}
        </section>
      )}

      <section className="glass-panel p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <Users className="h-4 w-4 text-secondary" />
          Quick Follow
        </h3>
        <ul className="space-y-2">
          {whoLoading ? (
            <li className="text-xs text-muted-foreground px-2 py-1">Loading...</li>
          ) : whoToFollow.length === 0 ? (
            <li className="text-xs text-muted-foreground px-2 py-1">No startups yet</li>
          ) : (
            whoToFollow.map((startup) => (
              <li key={startup.id} className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                <Link to={`/startup/${startup.slug}`} className="flex items-center gap-2 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-muted overflow-hidden flex items-center justify-center text-xs">
                    {startup.logo_url ? (
                      <img src={startup.logo_url} alt={startup.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      "R"
                    )}
                  </div>
                  <span className="text-sm text-foreground truncate">{startup.name}</span>
                </Link>
                <FollowChip startupId={startup.id} />
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="glass-panel p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <Users className="h-4 w-4 text-primary" />
          Popular Communities
        </h3>
        <ul className="space-y-1">
          {popularCommunities.length === 0 ? (
            <li className="text-xs text-muted-foreground px-2 py-1">Loading...</li>
          ) : (
            popularCommunities.map((community) => (
              <li key={community.slug}>
                <Link
                  to={`/community/${community.slug}`}
                  className="flex justify-between items-center text-sm hover:bg-muted/40 rounded-lg px-2 py-1.5 transition-colors"
                >
                  <span className="text-foreground">
                    {community.icon} {community.name}
                  </span>
                  <span className="text-muted-foreground text-xs">{community.posts} posts</span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>

      {/* Roles at startups you follow */}
      {followedRoles.length > 0 && user && (
        <section className="glass-panel p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
            <Briefcase className="h-4 w-4 text-secondary" />
            Roles at startups you follow
          </h3>
          <ul className="space-y-2">
            {followedRoles.map((role: any) => (
              <li key={role.id}>
                <Link
                  to={`/startup/${role.startups?.slug || ""}#open-roles`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="h-6 w-6 rounded-full bg-muted overflow-hidden shrink-0 flex items-center justify-center text-[10px]">
                    {role.startups?.logo_url ? (
                      <img src={role.startups.logo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      role.startups?.name?.[0] || "R"
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-foreground truncate font-medium">{role.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{role.startups?.name}</p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                    {role.role_type}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="glass-panel p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <Briefcase className="h-4 w-4 text-secondary" />
          From Space Startups
        </h3>
        <ul className="space-y-1">
          {topStartups.length === 0 ? (
            <li className="text-xs text-muted-foreground px-2 py-1">Loading...</li>
          ) : (
            topStartups.map((startup) => (
              <li key={startup.id}>
                <Link
                  to={`/startup/${startup.slug}`}
                  className="flex justify-between items-center text-sm hover:bg-muted/40 rounded-lg px-2 py-1.5 transition-colors"
                >
                  <span className="text-foreground">{startup.name}</span>
                  <span className="text-xs text-primary">{startup.recent} posts</span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>
    </aside>
  );
};

export default RightSidebar;
