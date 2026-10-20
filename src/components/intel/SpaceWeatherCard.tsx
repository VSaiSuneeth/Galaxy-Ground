import { Link } from "react-router-dom";
import type { ApodEntry, TrendingHashtag } from "@/hooks/useIntelDashboard";

interface LaunchSummary {
  name: string;
  slug: string;
  launchDate: string;
}

interface DiscoverySummary {
  title: string;
  slug: string;
}

interface Props {
  apod: ApodEntry;
  nextLaunch?: LaunchSummary | null;
  discoveryOfDay?: DiscoverySummary | null;
  topTrending?: TrendingHashtag | null;
}

export const SpaceWeatherCard = ({ apod, nextLaunch, discoveryOfDay, topTrending }: Props) => {
  const desc = apod.explanation
    ? apod.explanation.length > 120
      ? apod.explanation.slice(0, 120) + "…"
      : apod.explanation
    : "";

  return (
    <div
      className="rounded-xl overflow-hidden border border-glass-border"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(16px)" }}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="sm:w-[40%] shrink-0">
          <img
            src={apod.thumbnail_url || apod.url}
            alt={apod.title}
            className="w-full h-48 sm:h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Content */}
        <div className="flex-1 p-4 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-foreground">{apod.title}</h3>
            {desc && <p className="text-xs text-muted-foreground mt-1">{desc}</p>}
          </div>

          <div className="space-y-2 text-xs">
            {nextLaunch && (
              <Link
                to={`/launch/${nextLaunch.slug}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <span>🚀</span>
                <span>
                  {nextLaunch.name} —{" "}
                  {Math.max(
                    0,
                    Math.ceil(
                      (new Date(nextLaunch.launchDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                    ),
                  )}{" "}
                  days
                </span>
              </Link>
            )}

            {discoveryOfDay && (
              <Link
                to={`/explore/${discoveryOfDay.slug}#discoveries`}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <span>🔭</span>
                <span>{discoveryOfDay.title}</span>
              </Link>
            )}

            {topTrending && (
              <Link
                to={`/hashtag/${topTrending.hashtag}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <span>✦</span>
                <span>
                  #{topTrending.hashtag} trending ↑{topTrending.velocity_pct}%
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
