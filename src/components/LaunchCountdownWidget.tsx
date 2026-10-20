import { CalendarClock, Rocket } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCompactCountdown, formatLaunchDate } from "@/lib/launches";
import { useUpcomingLaunches } from "@/hooks/useLaunches";

const statusClass = {
  GO: "bg-green-500/15 text-green-400",
  TBD: "bg-yellow-500/15 text-yellow-400",
  NET: "bg-blue-500/15 text-blue-400",
  HOLD: "bg-destructive/15 text-destructive",
};

interface Props {
  compact?: boolean;
  limit?: number;
}

const LaunchCountdownWidget = ({ compact = false, limit = 3 }: Props) => {
  const launches = useUpcomingLaunches(limit);

  return (
    <section className="glass-panel p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Rocket className="h-4 w-4 text-secondary" />
          Launch Calendar
        </h3>
        <Link to="/missions" className="text-[11px] text-primary hover:underline">
          View all
        </Link>
      </div>

      {launches.length === 0 ? (
        <p className="text-xs text-muted-foreground">No upcoming launches tracked yet.</p>
      ) : (
        <ul className="space-y-2">
          {launches.map((launch) => (
            <li key={launch.slug}>
              <Link
                to={`/launch/${launch.slug}`}
                className="block rounded-lg px-2 py-2 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{launch.missionName}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {launch.agency} · {launch.rocket}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusClass[launch.status]}`}>
                    {launch.status}
                  </span>
                </div>

                <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
                  {!compact && (
                    <span className="flex items-center gap-1 text-muted-foreground truncate">
                      <CalendarClock className="h-3 w-3 shrink-0" />
                      {formatLaunchDate(launch.launchDate)}
                    </span>
                  )}
                  <span className="ml-auto rounded-md bg-primary/10 px-2 py-1 font-mono text-primary">
                    T-{formatCompactCountdown(launch.launchDate)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default LaunchCountdownWidget;
