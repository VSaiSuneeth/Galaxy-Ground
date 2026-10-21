import { ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCommunitiesWithStats } from "@/hooks/useCommunities";
import { asArray } from "@/lib/safe-data";
import PageHeader from "@/components/kit/PageHeader";
import { Patch } from "@/components/brand/Patch";

const CommunitiesPage = () => {
  const { data: stats, isLoading } = useCommunitiesWithStats();

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-enter">
      <PageHeader title="Orbits" eyebrow="Communities" subtitle="Pick the corner of space you care about." />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {asArray(stats).map((c) => (
            <div key={c.meta.slug}>
              <Link
                to={`/community/${c.meta.slug}`}
                className="group block h-full rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary"
              >
                <div className="flex items-start gap-3">
                  <Patch seed={c.meta.slug} label={c.meta.name} size={48} shape="squircle" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {c.meta.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.meta.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
                        <span>{c.postsCount} posts</span>
                        <span>{c.orbitMembersCount} members</span>
                      </div>
                      <span className="text-xs text-primary flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        Open <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunitiesPage;
