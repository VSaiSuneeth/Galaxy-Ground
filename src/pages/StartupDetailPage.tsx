import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Building2, Calendar, Globe, Loader2, MapPin, Briefcase } from "lucide-react";
import { useStartup, useStartupPosts } from "@/hooks/useStartups";
import { useFollow } from "@/hooks/useFollow";
import { useStartupRoles } from "@/hooks/useStartupRoles";
import FollowButton from "@/components/FollowButton";
import { asArray } from "@/lib/safe-data";
import { buildGeneratedPostDisplay } from "@/lib/generated-content-presentation";
import PostCard from "@/components/PostCard";
import type { FeedPost } from "@/types/feed";

const StartupDetailPage = () => {
  const { slug = "" } = useParams();
  const { data: startup, isLoading } = useStartup(slug);
  const { data: posts, isLoading: postsLoading } = useStartupPosts(startup?.id);
  const { data: roles, isLoading: rolesLoading } = useStartupRoles(startup?.id);
  const postList = asArray(posts);
  const { followers } = useFollow({ targetType: "startup", targetId: startup?.id });
  const feedPosts: FeedPost[] = startup
    ? postList.map((p) => {
        const display = buildGeneratedPostDisplay({
          title: p.title,
          content: p.content || p.summary,
          summary: null,
          hashtags: p.hashtags,
          category: startup.category,
          authorName: startup.name,
          kind: "startup",
        });

        return {
          id: `startup_${p.id}`,
          user_id: startup.id,
          content: display.content,
          media_url: p.image_url || null,
          media_type: p.image_url ? "image" : null,
          community: startup.category || null,
          hashtags: display.hashtags.length ? display.hashtags : asArray(p.hashtags),
          created_at: p.published_at,
          author: {
            user_id: startup.id,
            username: startup.slug,
            display_name: startup.name,
            avatar_url: startup.logo_url || null,
          },
          likes_count: Number(p.likes_count || 0),
          comments_count: 0,
          source: "startup",
          target_id: p.id,
          startup_id: startup.id,
          startup_slug: startup.slug,
          startup_name: startup.name,
          source_url: p.source_url,
        };
      })
    : [];

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto glass-panel p-10 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="max-w-2xl mx-auto glass-panel p-8 text-center text-sm text-muted-foreground">
        Startup not found.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Link to="/startups" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-3.5 w-3.5" /> All Startups
      </Link>

      <div className="glass-panel p-6">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0">
            <Building2 className="h-7 w-7 text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground">{startup.name}</h1>
            <p className="text-xs uppercase tracking-wider text-primary mt-1">{startup.category}</p>
            {startup.description && (
              <p className="text-sm text-foreground/80 leading-relaxed mt-3">{startup.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs">
              <span>
                <b className="text-foreground">{postList.length}</b> <span className="text-muted-foreground">posts</span>
              </span>
              <span>
                <b className="text-foreground">{followers}</b> <span className="text-muted-foreground">followers</span>
              </span>
            </div>
          </div>
          <FollowButton targetType="startup" targetId={startup.id} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 text-sm">
          {startup.founded && (
            <Info icon={<Calendar className="h-4 w-4" />} label="Founded" value={startup.founded} />
          )}
          {startup.hq && (
            <Info icon={<MapPin className="h-4 w-4" />} label="HQ" value={startup.hq} />
          )}
          {startup.website && (
            <a
              href={startup.website}
              target="_blank"
              rel="noreferrer"
              className="bg-muted/30 hover:bg-muted/50 rounded-lg p-3 transition-colors"
            >
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Globe className="h-4 w-4" /> Website
              </div>
              <p className="text-sm text-primary truncate">{startup.website.replace("https://", "").replace("http://", "")}</p>
            </a>
          )}
        </div>
      </div>

      {/* Open Roles Section */}
      <div className="glass-panel p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Open Roles</h2>
        {rolesLoading ? (
          <div className="flex h-20 items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : roles && roles.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open roles at the moment.</p>
        ) : (
          <div className="space-y-3">
            {roles.map((role) => (
              <div key={role.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="flex-shrink-0 h-8 w-8 rounded bg-secondary/20 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{role.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {role.role_type} • {role.work_mode}{role.location ? ` • ${role.location}` : ""}
                  </p>
                  {role.description && (
                    <p className="mt-1 text-sm text-foreground/80 line-clamp-2">{role.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <a
                      href={role.apply_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-sm btn-primary"
                    >
                      Apply
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {postsLoading ? (
        <div className="glass-panel p-8 flex justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : postList.length === 0 ? (
        <div className="glass-panel p-8 text-center text-sm text-muted-foreground">No updates yet. Auto-fetching from sources will appear here.</div>
      ) : (
        <div className="space-y-3">
          {feedPosts.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      )}
    </div>
  );
};

const Info = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="bg-muted/30 rounded-lg p-3">
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">{icon} {label}</div>
    <p className="text-sm text-foreground">{value}</p>
  </div>
);

export default StartupDetailPage;
