import { Link } from "react-router-dom";
import { MapPin, Loader2, ExternalLink } from "lucide-react";
import { useStartups } from "@/hooks/useStartups";
import { useMemo, useState } from "react";
import { asArray } from "@/lib/safe-data";
import PageHeader from "@/components/kit/PageHeader";
import { Patch } from "@/components/brand/Patch";

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
    <div className="mx-auto max-w-5xl space-y-6 animate-enter">
      <PageHeader title="Launchpad" eyebrow="New-space companies" subtitle="Live updates from the companies building the next decade in orbit." />

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors ${
                active === c
                  ? "border-primary bg-accent text-primary"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <Link
              key={s.id}
              to={`/startup/${s.slug}`}
            className="group rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary"
            >
              <div className="flex items-start gap-3">
                {s.logo_url ? <img src={s.logo_url} alt={s.name} className="h-11 w-11 shrink-0 rounded-[28%] object-cover" /> : <Patch seed={s.id} label={s.name} size={44} shape="squircle" />}
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {s.name}
                  </h3>
                  <p className="telemetry mt-0.5 text-primary">
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
