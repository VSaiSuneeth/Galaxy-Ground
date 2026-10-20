import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Eye, Users, Briefcase } from "lucide-react";

interface Props {
  startupId: string;
}

interface RoleStats {
  id: string;
  title: string;
  posted_at: string;
  is_active: boolean;
  views_7d: number;
  views_30d: number;
}

interface BadgeCount {
  badge: string;
  count: number;
}

export const AnalyticsTab = ({ startupId }: Props) => {
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [views30d, setViews30d] = useState(0);
  const [uniqueViewers, setUniqueViewers] = useState(0);
  const [roleStats, setRoleStats] = useState<RoleStats[]>([]);
  const [badgeCounts, setBadgeCounts] = useState<BadgeCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalViews30d, setTotalViews30d] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Get role IDs for this startup
      const { data: roles } = await supabase
        .from("startup_roles")
        .select("id, title, posted_at, is_active")
        .eq("startup_id", startupId)
        .order("posted_at", { ascending: false });
      const ids = (roles || []).map((r: any) => r.id);
      setRoleIds(ids);
      setRoleStats((roles || []).map((r: any) => ({ ...r, views_7d: 0, views_30d: 0 })));

      if (ids.length === 0) {
        setLoading(false);
        return;
      }

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Total views in last 30 days
      const { count: total30 } = await supabase
        .from("role_views")
        .select("id", { count: "exact", head: true })
        .in("role_id", ids)
        .gte("viewed_at", thirtyDaysAgo);
      setTotalViews30d(total30 || 0);

      // Unique viewers (distinct session_id) in last 30 days
      const { data: unique } = await supabase
        .from("role_views")
        .select("session_id")
        .in("role_id", ids)
        .gte("viewed_at", thirtyDaysAgo);
      const uniqueSessions = new Set((unique || []).map((r: any) => r.session_id));
      setUniqueViewers(uniqueSessions.size);

      // Per-role stats
      const stats: RoleStats[] = [];
      for (const id of ids) {
        const { count: v7 } = await supabase
          .from("role_views")
          .select("id", { count: "exact", head: true })
          .eq("role_id", id)
          .gte("viewed_at", sevenDaysAgo);
        const { count: v30 } = await supabase
          .from("role_views")
          .select("id", { count: "exact", head: true })
          .eq("role_id", id)
          .gte("viewed_at", thirtyDaysAgo);
        const role = (roles || []).find((r: any) => r.id === id);
        stats.push({
          id,
          title: role?.title || "Unknown",
          posted_at: role?.posted_at || "",
          is_active: role?.is_active ?? true,
          views_7d: v7 || 0,
          views_30d: v30 || 0,
        });
      }
      setRoleStats(stats);

      // Badge affinity
      const { data: badgeData } = await supabase
        .from("role_views")
        .select("viewer_badges")
        .in("role_id", ids)
        .gte("viewed_at", thirtyDaysAgo)
        .not("viewer_badges", "is", null);
      const badgeMap = new Map<string, number>();
      let badgeTotal = 0;
      for (const row of (badgeData || []) as any[]) {
        if (Array.isArray(row.viewer_badges)) {
          for (const b of row.viewer_badges) {
            badgeMap.set(b, (badgeMap.get(b) || 0) + 1);
            badgeTotal++;
          }
        }
      }
      if (badgeTotal >= 5) {
        setBadgeCounts(
          Array.from(badgeMap.entries())
            .map(([badge, count]) => ({ badge, count }))
            .sort((a, b) => b.count - a.count)
        );
      }
      setLoading(false);
    };
    load();
  }, [startupId]);

  if (loading) {
    return (
      <div className="glass-panel p-6 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (roleIds.length === 0) {
    return (
      <div className="glass-panel p-8 text-center text-sm text-muted-foreground">
        Post a role to see analytics.
      </div>
    );
  }

  const maxBadge = Math.max(1, ...badgeCounts.map((b) => b.count));

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Eye className="h-4 w-4" /> Total Views (30d)
          </div>
          <p className="text-2xl font-bold text-foreground">{totalViews30d}</p>
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Users className="h-4 w-4" /> Unique Viewers (30d)
          </div>
          <p className="text-2xl font-bold text-foreground">{uniqueViewers}</p>
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Briefcase className="h-4 w-4" /> Roles Posted
          </div>
          <p className="text-2xl font-bold text-foreground">{roleIds.length}</p>
        </div>
      </div>

      {/* Per-role table */}
      <div className="glass-panel p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Per-Role Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-glass-border">
                <th className="text-left pb-2 font-medium">Role</th>
                <th className="text-right pb-2 font-medium">Views 7d</th>
                <th className="text-right pb-2 font-medium">Views 30d</th>
                <th className="text-right pb-2 font-medium">Posted</th>
                <th className="text-right pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {roleStats.map((rs) => (
                <tr key={rs.id} className="border-b border-glass-border/50">
                  <td className="py-2 text-foreground">{rs.title}</td>
                  <td className="py-2 text-right text-muted-foreground">{rs.views_7d}</td>
                  <td className="py-2 text-right text-muted-foreground">{rs.views_30d}</td>
                  <td className="py-2 text-right text-muted-foreground text-[11px]">
                    {new Date(rs.posted_at).toLocaleDateString()}
                  </td>
                  <td className="py-2 text-right">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${rs.is_active ? "bg-green-500/10 text-green-400" : "bg-muted/30 text-muted-foreground"}`}>
                      {rs.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Badge Affinity */}
      {badgeCounts.length > 0 && (
        <div className="glass-panel p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Viewer Badge Affinity</h3>
          <div className="space-y-2">
            {badgeCounts.map((b) => (
              <div key={b.badge} className="flex items-center gap-3">
                <span className="text-xs text-foreground w-24 shrink-0">{b.badge}</span>
                <div className="flex-1 h-5 rounded bg-muted/30 overflow-hidden">
                  <div
                    className="h-full rounded bg-primary/30 transition-all"
                    style={{ width: `${(b.count / maxBadge) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">{b.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
