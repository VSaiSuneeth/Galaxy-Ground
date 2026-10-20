import { CalendarClock, Filter, MapPin, Package, Rocket } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { filterLaunches, formatLaunchDate, groupLaunchesByMonth, type LaunchFilters } from "@/lib/launches";
import { useLaunchCountdown, useUpcomingLaunches } from "@/hooks/useLaunches";

const CountdownTimer = ({ launchDate }: { launchDate: string }) => {
  const timeLeft = useLaunchCountdown(launchDate);
  const units = [
    ["days", timeLeft.days],
    ["hrs", timeLeft.hours],
    ["min", timeLeft.minutes],
    ["sec", timeLeft.seconds],
  ] as const;

  return (
    <div className="grid grid-cols-4 gap-2">
      {units.map(([unit, value]) => (
        <div key={unit} className="text-center">
          <div className="min-w-[42px] rounded-lg bg-muted/60 px-2.5 py-1.5 font-mono text-lg font-bold text-primary">
            {String(value).padStart(2, "0")}
          </div>
          <p className="mt-1 text-[10px] uppercase text-muted-foreground">{unit}</p>
        </div>
      ))}
    </div>
  );
};

const statusClass = {
  GO: "bg-green-500/20 text-green-400",
  TBD: "bg-yellow-500/20 text-yellow-400",
  NET: "bg-blue-500/20 text-blue-400",
  HOLD: "bg-destructive/20 text-destructive",
};

const MissionsPage = () => {
  const launches = useUpcomingLaunches();
  const [filters, setFilters] = useState<LaunchFilters>({ status: "ALL", agency: "" });

  const visibleLaunches = useMemo(() => filterLaunches(launches, filters), [launches, filters]);
  const groupedLaunches = useMemo(() => groupLaunchesByMonth(visibleLaunches), [visibleLaunches]);
  const agencies = useMemo(() => Array.from(new Set(launches.map((launch) => launch.agency))).sort(), [launches]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="glass-panel p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <Rocket className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground glow-text">Launch Calendar</h1>
            <p className="text-sm text-muted-foreground">
              Upcoming launch windows and mission countdowns for the space industry watchlist.
            </p>
          </div>
        </div>
      </div>

      {/* Live from GG Section */}
      <div className="glass-panel p-5 border-primary/30 bg-primary/5">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <h2 className="text-sm font-semibold text-foreground">Live from Galaxy Ground</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Tune in for live coverage of upcoming launches, expert commentary, and mission updates.
        </p>
        <Link
          to="/live"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Rocket className="h-4 w-4" />
          Watch Live
        </Link>
      </div>

      <div className="glass-panel p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Filter className="h-4 w-4 text-primary" />
            Filters
          </div>
          <select
            value={filters.status ?? "ALL"}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as LaunchFilters["status"] }))}
            className="rounded-md border border-glass-border bg-background/70 px-2.5 py-2 text-sm text-foreground"
          >
            <option value="ALL">All statuses</option>
            <option value="GO">GO</option>
            <option value="NET">NET</option>
            <option value="TBD">TBD</option>
            <option value="HOLD">HOLD</option>
          </select>
          <select
            value={filters.agency ?? ""}
            onChange={(event) => setFilters((current) => ({ ...current, agency: event.target.value }))}
            className="rounded-md border border-glass-border bg-background/70 px-2.5 py-2 text-sm text-foreground"
          >
            <option value="">All agencies</option>
            {agencies.map((agency) => (
              <option key={agency} value={agency}>
                {agency}
              </option>
            ))}
          </select>
        </div>
      </div>

      {visibleLaunches.length === 0 ? (
        <div className="glass-panel p-6 text-sm text-muted-foreground">No launches match the current filters.</div>
      ) : (
        <div className="space-y-6">
          {groupedLaunches.map(({ month, launches: monthLaunches }) => (
            <div key={month} className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{month}</h2>
              <div className="space-y-4">
                {monthLaunches.map((launch, index) => (
                  <motion.div
                    key={launch.slug}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <Link
                      to={`/launch/${launch.slug}`}
                      className="block glass-panel p-5 transition-colors hover:border-primary/20"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-foreground">{launch.missionName}</h3>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusClass[launch.status]}`}>
                              {launch.status}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-primary">
                            {launch.agency} · {launch.rocket}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{launch.description}</p>
                          <div className="mt-3 grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-2">
                            <span className="flex items-center gap-1">
                              <CalendarClock className="h-3.5 w-3.5" />
                              {formatLaunchDate(launch.launchDate)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {launch.pad}
                            </span>
                            <span className="flex items-center gap-1 sm:col-span-2">
                              <Package className="h-3.5 w-3.5" />
                              {launch.payload}
                            </span>
                          </div>
                        </div>
                        <CountdownTimer launchDate={launch.launchDate} />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MissionsPage;
