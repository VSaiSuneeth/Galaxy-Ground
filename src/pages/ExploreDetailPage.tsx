import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Compass,
  Loader2,
  Microscope,
  Newspaper,
  Sparkles,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTopics } from "@/hooks/useTopics";
import { findTopicBySlug } from "@/lib/topics";

const ExploreDetailPage = () => {
  const { slug } = useParams();
  const { data: topics = [], isLoading } = useTopics();
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "discoveries" | "updates">("overview");

  const topic = useMemo(() => findTopicBySlug(topics, slug), [topics, slug]);

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center rounded-2xl border border-glass-border bg-background/70 p-12 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading topic intelligence…
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 rounded-2xl border border-glass-border bg-background/70 p-8 text-center">
        <p className="text-sm font-medium text-muted-foreground">That topic is not available yet.</p>
        <Link to="/explore" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Return to explore
        </Link>
      </div>
    );
  }

  const tabs = [
    { key: "overview" as const, label: "Overview", icon: Sparkles },
    { key: "history" as const, label: "History", icon: CalendarDays },
    { key: "discoveries" as const, label: "Discoveries", icon: Microscope },
    { key: "updates" as const, label: "Live Updates", icon: Newspaper },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link to="/explore" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Explore
      </Link>

      <section className="glass-panel overflow-hidden">
        <div className="relative min-h-[260px]">
          <img src={topic.image} alt={topic.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-primary">{topic.subtitle}</p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">{topic.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{topic.description}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-background/70 px-3 py-1">{topic.updated}</span>
              <span className="rounded-full bg-background/70 px-3 py-1">{topic.sourceClass}</span>
              <span className="rounded-full bg-background/70 px-3 py-1">{topic.dataSource === "supabase" ? "Supabase-backed" : "Fallback intelligence"}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="glass-panel p-2">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
          <TabsList className="grid grid-cols-4 bg-muted/40">
            {tabs.map(({ key, label, icon: Icon }) => (
              <TabsTrigger key={key} value={key} className="gap-2">
                <Icon className="h-4 w-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="glass-panel p-6">
          {activeTab === "overview" && (
            <div className="space-y-5">
              <SectionBlock title="Why this topic matters" icon={<Compass className="h-4 w-4 text-primary" />}>
                <p className="text-sm leading-relaxed text-muted-foreground">{topic.description}</p>
              </SectionBlock>
              <SectionBlock title="Key facts" icon={<BookOpen className="h-4 w-4 text-primary" />}>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {topic.facts.map((fact) => (
                    <li key={fact} className="rounded-lg bg-muted/40 px-3 py-2">
                      {fact}
                    </li>
                  ))}
                </ul>
              </SectionBlock>
            </div>
          )}

          {activeTab === "history" && (
            <SectionBlock title="Timeline" icon={<CalendarDays className="h-4 w-4 text-primary" />}>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {topic.timeline.map((entry) => (
                  <li key={entry} className="rounded-lg bg-muted/40 px-3 py-2">
                    {entry}
                  </li>
                ))}
              </ul>
            </SectionBlock>
          )}

          {activeTab === "discoveries" && (
            <SectionBlock title="Recent discoveries" icon={<Microscope className="h-4 w-4 text-primary" />}>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {topic.discoveries.map((entry) => (
                  <li key={entry} className="rounded-lg bg-muted/40 px-3 py-2">
                    {entry}
                  </li>
                ))}
              </ul>
            </SectionBlock>
          )}

          {activeTab === "updates" && (
            <div className="space-y-5">
              <SectionBlock title="Mission watch" icon={<Newspaper className="h-4 w-4 text-primary" />}>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {topic.research.map((entry) => (
                    <li key={entry} className="rounded-lg bg-muted/40 px-3 py-2">
                      {entry}
                    </li>
                  ))}
                </ul>
              </SectionBlock>
              <SectionBlock title="Related tags" icon={<Sparkles className="h-4 w-4 text-primary" />}>
                <div className="flex flex-wrap gap-2">
                  {topic.tags.map((tag) => (
                    <Link key={tag} to={`/hashtag/${tag}`} className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary hover:bg-primary/20">
                      #{tag}
                    </Link>
                  ))}
                </div>
              </SectionBlock>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="glass-panel p-6">
            <h2 className="text-sm font-semibold text-foreground">How this helps</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Explore now gives you a fast landing page for each topic so you can jump from overview to mission context without leaving the experience.
            </p>
          </div>
          <div className="glass-panel p-6">
            <h2 className="text-sm font-semibold text-foreground">Signal sources</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              The detail view uses the same topic intelligence payload as the index, so it remains useful even when Supabase-backed content is not available yet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionBlock = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <span className="text-primary">{icon}</span>
      {title}
    </div>
    {children}
  </div>
);

export default ExploreDetailPage;
