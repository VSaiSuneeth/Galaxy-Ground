import { Briefcase, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useFollow } from "@/hooks/useFollow";
import { useSidebarStats } from "@/hooks/useSidebarStats";
import { useTrendingHashtags } from "@/hooks/useTrendingHashtags";
import { useWhoToFollow } from "@/hooks/useWhoToFollow";
import { useFeaturedContent } from "@/hooks/useFeaturedContent";
import type { IntelOpenRole } from "@/hooks/useIntelDashboard";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { asArray } from "@/lib/safe-data";
import { allowFallbackData } from "@/lib/fallback-data";
import LaunchCountdownWidget from "@/components/LaunchCountdownWidget";
import { Patch } from "@/components/brand/Patch";

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
      className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
        isFollowing
          ? "border border-border text-foreground hover:bg-muted"
          : "border border-primary text-primary hover:bg-accent"
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
  const hasTrending = asArray(trending).length > 0;
  const topics = hasTrending ? asArray(trending) : allowFallbackData ? fallbackTrending : [];
  const popularCommunities = asArray(stats?.communities).slice(0, 4);
  const topStartups = asArray(stats?.topStartups);
  const [followedRoles, setFollowedRoles] = useState<IntelOpenRole[]>([]);

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
        const startupIds = (follows ?? []).flatMap((follow) => follow.target_id ? [follow.target_id] : []);
        if (startupIds.length === 0) { setFollowedRoles([]); return; }
        supabase
          .from("startup_roles")
          .select("id, title, role_type, startup_id, startups!inner(slug, name, logo_url)")
          .eq("is_active", true)
          .in("startup_id", startupIds)
          .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
          .order("posted_at", { ascending: false })
          .limit(3)
          .then(({ data }) => setFollowedRoles((data ?? []).flatMap((role) => {
            const startup = Array.isArray(role.startups) ? role.startups[0] : role.startups;
            if (!startup) return [];
            return [{
              id: role.id,
              title: role.title,
              role_type: role.role_type,
              startup_id: role.startup_id,
              startups: { slug: startup.slug, name: startup.name, logo_url: startup.logo_url },
            }];
          })), () => setFollowedRoles([]));
      }, () => setFollowedRoles([]));
  }, [user]);

  return (
    <aside className="hidden w-80 shrink-0 space-y-5 border-l border-border py-5 pl-6 pr-4 xl:sticky xl:top-0 xl:block xl:h-dvh xl:overflow-y-auto xl:scrollbar-none">
      <section className="border-b border-border pb-4">
        <h3 className="telemetry mb-3">Trending</h3>
        {!hasTrending && allowFallbackData && <p className="mb-2 text-[13px] text-muted-foreground">Sample data</p>}
        <ul className="space-y-1">
          {topics.map((topic) => (
            <li key={topic.tag}>
              <Link
                to={`/hashtag/${topic.tag}`}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors"
              >
                <span className="text-primary font-medium">#{topic.tag}</span>
                {topic.count > 0 ? <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{topic.count}</span> : <span className="telemetry text-primary">New</span>}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <LaunchCountdownWidget compact />

      {/* India in Space Spotlight */}
      {indiaInSpace && (
        <section className="border-b border-border pb-4">
          <h3 className="telemetry mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            India in Space
          </h3>
          {indiaInSpace.image_url && (
            <img
              src={indiaInSpace.image_url}
              alt={indiaInSpace.title}
              className="mb-3 h-32 w-full rounded-lg object-cover"
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

      <section className="border-b border-border pb-4">
        <h3 className="telemetry mb-3">Who to follow</h3>
        <ul className="space-y-2">
          {whoLoading ? (
            <li className="text-xs text-muted-foreground px-2 py-1">Loading...</li>
          ) : whoToFollow.length === 0 ? (
            <li className="text-xs text-muted-foreground px-2 py-1">No startups yet</li>
          ) : (
            whoToFollow.map((startup) => (
              <li key={startup.id} className="flex items-center justify-between gap-2 rounded-md p-2 hover:bg-muted transition-colors">
                <Link to={`/startup/${startup.slug}`} className="flex items-center gap-2 min-w-0">
                  {startup.logo_url ? <img src={startup.logo_url} alt={startup.name} className="h-8 w-8 rounded-[28%] object-cover" loading="lazy" /> : <Patch seed={startup.id} label={startup.name} size={32} shape="squircle" />}
                  <span className="text-sm text-foreground truncate">{startup.name}</span>
                </Link>
                <FollowChip startupId={startup.id} />
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="border-b border-border pb-4">
        <h3 className="telemetry mb-3">Orbits</h3>
        <ul className="space-y-1">
          {popularCommunities.length === 0 ? (
            <li className="text-xs text-muted-foreground px-2 py-1">Loading...</li>
          ) : (
            popularCommunities.map((community) => (
              <li key={community.slug}>
                <Link
                  to={`/community/${community.slug}`}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                >
                  <span className="text-foreground">
                    {community.name}
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
        <section className="border-b border-border pb-4">
          <h3 className="telemetry mb-3 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-secondary" />
            Roles at startups you follow
          </h3>
          <ul className="space-y-2">
            {followedRoles.map((role) => (
              <li key={role.id}>
                <Link
                  to={`/startup/${role.startups?.slug || ""}#open-roles`}
                  className="flex items-center gap-3 rounded-md p-2 hover:bg-muted transition-colors"
                >
                  {role.startups?.logo_url ? <img src={role.startups.logo_url} alt="" className="h-7 w-7 shrink-0 rounded-[28%] object-cover" /> : <Patch seed={role.startup_id} label={role.startups?.name} size={28} shape="squircle" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-foreground truncate font-medium">{role.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{role.startups?.name}</p>
                  </div>
                  <span className="telemetry rounded-sm border border-border px-1.5 py-0.5 text-primary">
                    {role.role_type}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="border-b border-border pb-4">
        <h3 className="telemetry mb-3">From Launchpad</h3>
        <ul className="space-y-1">
          {topStartups.length === 0 ? (
            <li className="text-xs text-muted-foreground px-2 py-1">Loading...</li>
          ) : (
            topStartups.map((startup) => (
              <li key={startup.id}>
                <Link
                  to={`/startup/${startup.slug}`}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors"
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
