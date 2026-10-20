import { Link } from "react-router-dom";
import { Building2, MapPin, Loader2, ExternalLink } from "lucide-react";
import { useStartups } from "@/hooks/useStartups";
import { useMemo, useState } from "react";
import { asArray } from "@/lib/safe-data";

const CATEGORIES = [
  "All",
  "Launch Vehicles",
  "Satellite Manufacturers",
  "Space Data & Analytics",
  "Specialized Tech & Services",
] as const;

const StartupsPage = () => {
  const { data: startups, isLoading } = useStartups();
  const [active, setActive] = useState<(typeof CATEGORIES)[number]>("All");

  const startupList = asArray(startups);
  const filtered = useMemo(() => {
    return active === "All" ? startupList : startupList.filter((s) => s.category === active);
  }, [startupList, active]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="glass-panel p-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground glow-text">Space Startups</h1>
            <p className="text-sm text-muted-foreground">
              Live updates from the new-space ecosystem
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                active === c
                  ? "bg-primary text-primary-foreground glow-border"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <div className="glass-panel p-10 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <Link
              key={s.id}
              to={`/startup/${s.slug}`}
              className="glass-panel p-5 group hover:ring-1 hover:ring-primary/40 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-secondary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {s.name}
                  </h3>
                  <p className="text-[11px] uppercase tracking-wider text-primary/80 mt-0.5">
                    {s.category}
                  </p>
                </div>
              </div>
              {s.description && (
                <p className="text-xs text-muted-foreground mt-3 line-clamp-3 leading-relaxed">
                  {s.description}
                </p>
              )}
              <div className="flex items-center justify-between mt-4 text-[11px] text-muted-foreground">
                {s.hq && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {s.hq}
                  </span>
                )}
                {s.website && (
                  <span className="inline-flex items-center gap-1 text-primary/80">
                    <ExternalLink className="h-3 w-3" /> Site
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default StartupsPage;
