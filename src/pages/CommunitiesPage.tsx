import { Users, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useCommunitiesWithStats } from "@/hooks/useCommunities";
import { asArray } from "@/lib/safe-data";

const CommunitiesPage = () => {
  const { data: stats, isLoading } = useCommunitiesWithStats();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground glow-text">Communities</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Each community brings together creators and startups around a single space niche.
        Counts and posts update in real time.
      </p>

      {isLoading ? (
        <div className="glass-panel p-10 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {asArray(stats).map((c, i) => (
            <motion.div
              key={c.meta.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                to={`/community/${c.meta.slug}`}
                className="block glass-panel p-5 hover:border-primary/30 transition-colors group h-full"
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{c.meta.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {c.meta.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.meta.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{c.accountsCount} accounts</span>
                        <span>{c.postsCount} posts</span>
                        <span>{c.orbitMembersCount} members</span>
                        <span>{c.membersCount} followers</span>
                      </div>
                      <span className="text-xs text-primary flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        Open <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunitiesPage;
