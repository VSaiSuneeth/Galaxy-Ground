import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  Newspaper,
  Package,
  Radio,
  Rocket,
  BookOpen,
} from "lucide-react";
import { formatLaunchDate } from "@/lib/launches";
import { useLaunch, useLaunchCountdown } from "@/hooks/useLaunches";

const statusCopy = {
  GO: "Tracking as go for the current window.",
  TBD: "Date or time is still provisional.",
  NET: "No earlier than this launch window.",
  HOLD: "Launch activity is paused or under review.",
};

const LaunchDetailPage = () => {
  const { slug = "" } = useParams();
  const { data: launch, isLoading } = useLaunch(slug);
  const countdown = useLaunchCountdown(launch?.launchDate ?? new Date().toISOString());

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl glass-panel flex justify-center p-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!launch) {
    return (
      <div className="mx-auto max-w-2xl glass-panel p-8 text-center text-sm text-muted-foreground">
        Launch not found.
      </div>
    );
  }

  const tMinus = countdown.isLive
    ? "Live"
    : `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s`;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link to="/missions" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-3.5 w-3.5" /> All launches
      </Link>

      <div className="glass-panel p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground">{launch.missionName}</h1>
              <p className="text-xs text-muted-foreground">
                {launch.agency} - {launch.rocket}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-glass-border bg-muted/30 px-4 py-3 text-left sm:text-right">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Status</p>
            <p className="text-sm font-semibold text-primary">{launch.status}</p>
            <p className="mt-1 max-w-[220px] text-xs text-muted-foreground">{statusCopy[launch.status]}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Info icon={<Calendar className="h-4 w-4" />} label="Launch window" value={formatLaunchDate(launch.launchDate)} />
          <Info icon={<Rocket className="h-4 w-4" />} label="T-minus" value={tMinus} mono />
          <Info icon={<MapPin className="h-4 w-4" />} label="Launch pad" value={launch.pad} />
          <Info icon={<Package className="h-4 w-4" />} label="Payload" value={launch.payload} />
        </div>

        <div className="mt-6 border-t border-glass-border pt-6">
          <h3 className="mb-2 text-sm font-semibold text-foreground">Mission overview</h3>
          <p className="text-sm leading-relaxed text-foreground/80">{launch.description}</p>
          {launch.sourceLink && (
            <a
              href={launch.sourceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              Source <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="glass-panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Mission timeline</h2>
          </div>
          <div className="space-y-3">
            {launch.timeline.map((item, index) => (
              <div key={`${item}-${index}`} className="flex gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                  {index + 1}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Updates and related posts</h2>
          </div>
          <div className="space-y-3">
            {launch.updates.map((card) => (
              <div key={card.title} className="rounded-lg bg-muted/35 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {card.title}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{card.body}</p>
                {card.sourceUrl && (
                  <a
                    href={card.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                  >
                    Source <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {launch.sources.length > 0 && (
        <section className="glass-panel p-5">
          <h2 className="font-semibold text-foreground">Trusted sources</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {launch.sources.map((source) => (
              <a
                key={`${source.name}-${source.url}`}
                href={source.url || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary hover:bg-primary/20"
              >
                {source.name} · {source.trustLevel}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Live from Galaxy Ground — startup posts linked via related_launch_id */}
      {launch.relatedPosts && launch.relatedPosts.length > 0 && (
        <section className="glass-panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Live from Galaxy Ground</h2>
          </div>
          <div className="space-y-3">
            {launch.relatedPosts.map((post) => (
              <div key={post.id} className="rounded-lg bg-muted/35 p-3">
                <div className="flex items-start gap-2">
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt=""
                      className="mt-1 h-12 w-12 shrink-0 rounded object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{post.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-3">
                      {post.summary || post.content}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                      {post.startupName && <span>{post.startupName}</span>}
                      {post.sourceUrl && (
                        <a
                          href={post.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          Source <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="glass-panel p-5">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Data source</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {launch.dataSource === "supabase"
            ? "This mission page is reading launch data, updates, and sources from Supabase."
            : "This mission page is using the static launch fallback until Supabase launch tables are applied."}
        </p>
      </section>
    </div>
  );
};

const Info = ({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) => (
  <div className="rounded-lg bg-muted/30 p-3">
    <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
      {icon} {label}
    </div>
    <p className={`text-sm text-foreground ${mono ? "font-mono text-primary" : ""}`}>{value}</p>
  </div>
);

export default LaunchDetailPage;
