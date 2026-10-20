import {
  BookOpen,
  CalendarDays,
  Compass,
  ExternalLink,
  Loader2,
  Microscope,
  Newspaper,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTopics } from "@/hooks/useTopics";
import { EXPLORE_SOURCE_PILLS } from "@/lib/topics";

const ExplorePage = () => {
  const { data: topics = [], isLoading } = useTopics();
  const usingSupabase = topics.some((topic) => topic.dataSource === "supabase");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="glass-panel overflow-hidden">
        <div className="relative min-h-[250px] bg-[url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1400&q=85')] bg-cover bg-center">
          <div className="absolute inset-0 bg-background/80" />
          <div className="relative p-6 sm:p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
              <Compass className="h-6 w-6 text-primary" />
            </div>
            <h1 className="max-w-2xl text-3xl font-bold text-foreground glow-text">Explore Space</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Topic intelligence for planets, missions, observatories, and discoveries. Each topic separates stable facts
              from live updates so the page stays useful even when external feeds are quiet.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {EXPLORE_SOURCE_PILLS.map((pill) => (
                <span key={pill} className="rounded-full bg-muted/70 px-3 py-1 text-xs text-muted-foreground">
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="glass-panel flex justify-center p-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {topics.map((topic, index) => (
            <motion.article
              key={topic.slug}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="glass-panel overflow-hidden"
            >
              <div className="h-44 overflow-hidden">
                <img src={topic.image} alt={topic.title} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <p className="text-xs font-medium text-primary">{topic.subtitle}</p>
                  <h2 className="text-xl font-semibold text-foreground">{topic.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{topic.description}</p>
                </div>

                <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-primary" />
                    {topic.updated}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5 text-primary" />
                    {topic.sourceClass}
                  </span>
                </div>

                <Section icon={<BookOpen className="h-4 w-4" />} title="Key Facts" items={topic.facts} />
                <Section icon={<CalendarDays className="h-4 w-4" />} title="Timeline" items={topic.timeline} />
                <Section icon={<Newspaper className="h-4 w-4" />} title="Research Focus" items={topic.research} />
                <Section icon={<Microscope className="h-4 w-4" />} title="Discoveries" items={topic.discoveries} />

                <div className="flex flex-wrap gap-2 border-t border-glass-border pt-4">
                  <Link
                    to={`/explore/${topic.slug}`}
                    className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                  >
                    Open topic details
                  </Link>
                  {topic.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/hashtag/${tag}`}
                      className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary hover:bg-primary/20"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      <section className="glass-panel p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Data source</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {usingSupabase
            ? "Explore is reading topic intelligence from Supabase. Static fallback cards are used only when topic tables are missing."
            : "Explore is using local fallback topic cards until Supabase topic tables are applied and seeded."}
        </p>
      </section>
    </div>
  );
};

const Section = ({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) => (
  <div>
    <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
      <span className="text-primary">{icon}</span>
      {title}
    </div>
    <div className="flex flex-wrap gap-1.5">
      {items.length === 0 ? (
        <span className="text-[11px] text-muted-foreground">No items yet.</span>
      ) : (
        items.map((item) => (
          <span key={item} className="rounded-md bg-muted/50 px-2 py-1 text-[11px] text-muted-foreground">
            {item}
          </span>
        ))
      )}
    </div>
  </div>
);

export default ExplorePage;
