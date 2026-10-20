import { Activity, AlertTriangle, Bell, CheckCircle2, Database, Gauge, Loader2, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useSupabaseHealth } from "@/hooks/useSupabaseHealth";
import { formatCount, getCountState, getReadinessSummary, type ReadinessCheck, type ReadinessState } from "@/lib/readiness";

const stateClasses: Record<ReadinessState, string> = {
  ready: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  warning: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  blocked: "border-red-500/30 bg-red-500/10 text-red-300",
};

const AdminReadinessPage = () => {
  const { user, loading } = useAuth();
  const health = useSupabaseHealth();
  const role = useAdminRole(user?.id);
  const rpcProbe = useQuery({
    queryKey: ["readiness", "get_feed_page"],
    enabled: !!user && role.data === true,
    retry: false,
    queryFn: async () => {
      const { error } = await supabase.rpc("get_feed_page", {
        p_user_id: user!.id,
        p_page_offset: 0,
        p_page_size: 1,
        p_mode: "for-you",
      });
      if (!error) return { available: true, message: "get_feed_page RPC responded." };
      return { available: false, message: error.message || "get_feed_page RPC is not available yet." };
    },
  });

  if (loading || role.isLoading) {
    return (
      <div className="mx-auto max-w-3xl glass-panel p-10 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl glass-panel p-8 text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-primary" />
        <h1 className="mt-3 text-xl font-semibold text-foreground">Admin readiness requires sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in with an admin account to inspect launch-readiness checks.</p>
        <Link to="/auth" className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Sign in
        </Link>
      </div>
    );
  }

  if (!role.data) {
    return (
      <div className="mx-auto max-w-3xl glass-panel p-8 text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="mt-3 text-xl font-semibold text-foreground">Admin only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account is signed in, but it does not have the admin role required for readiness checks.
        </p>
      </div>
    );
  }

  const counts = health.data?.counts ?? {};
  const checks: ReadinessCheck[] = [
    {
      id: "supabase",
      label: "Supabase connection",
      state: health.data?.ok ? "ready" : "blocked",
      detail: health.data?.connectionError || "Schema health checks completed.",
    },
    {
      id: "content",
      label: "Content tables",
      state: getCountState(health.data?.totalContent),
      detail: `${formatCount(health.data?.totalContent)} total user, startup, and themed posts.`,
    },
    {
      id: "notifications",
      label: "Notifications table",
      state: getCountState(counts.notifications, false),
      detail: `${formatCount(counts.notifications)} notification rows. Empty is acceptable before real user activity.`,
    },
    {
      id: "rpc",
      label: "RPC feed",
      state: rpcProbe.data?.available ? "ready" : "warning",
      detail: rpcProbe.data?.message || "Waiting for get_feed_page RPC backend rollout.",
    },
  ];
  const summary = getReadinessSummary(checks);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section className="glass-panel p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Gauge className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground glow-text">Launch Readiness</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Admin-only production checklist for feed performance, schema health, notifications, and launch-blocking backend work.
            </p>
          </div>
          <div className={`rounded-xl border p-4 text-sm ${stateClasses[summary.state]}`}>
            <p className="font-semibold capitalize">{summary.state}</p>
            <p className="mt-1 text-xs">
              {summary.ready}/{summary.total} ready · {summary.warnings} warnings · {summary.blocked} blocked
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {checks.map((check) => (
          <article key={check.id} className={`rounded-xl border p-4 ${stateClasses[check.state]}`}>
            <div className="flex items-start gap-3">
              {check.state === "ready" ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              <div>
                <h2 className="font-semibold">{check.label}</h2>
                <p className="mt-1 text-sm opacity-90">{check.detail}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <ReadinessPanel
          icon={<Database className="h-5 w-5" />}
          title="Data Layer"
          items={[
            `Posts: ${formatCount(counts.posts)}`,
            `Startup posts: ${formatCount(counts.startup_posts)}`,
            `Themed posts: ${formatCount(counts.themed_posts)}`,
            `Profiles: ${formatCount(counts.profiles)}`,
          ]}
        />
        <ReadinessPanel
          icon={<Bell className="h-5 w-5" />}
          title="Notifications"
          items={[
            "Realtime notification hook is wired in the frontend.",
            "Notification triggers must be verified in Supabase.",
            "Unread count and mark-read UI exist in the top nav.",
          ]}
        />
        <ReadinessPanel
          icon={<Activity className="h-5 w-5" />}
          title="Remaining Backend Work"
          items={[
            "Apply get_feed_page RPC for a single paginated feed endpoint.",
            "Add/verify notification insert triggers for follows, comments, and reactions.",
            "Add post rate limiting and admin moderation policies.",
          ]}
        />
      </section>
    </div>
  );
};

const ReadinessPanel = ({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) => (
  <article className="glass-panel p-5">
    <div className="mb-3 flex items-center gap-2 text-foreground">
      <span className="text-primary">{icon}</span>
      <h2 className="font-semibold">{title}</h2>
    </div>
    <ul className="space-y-2 text-sm text-muted-foreground">
      {items.map((item) => (
        <li key={item} className="rounded-lg bg-muted/30 px-3 py-2">
          {item}
        </li>
      ))}
    </ul>
  </article>
);

export default AdminReadinessPage;
