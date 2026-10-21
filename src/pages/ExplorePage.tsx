import {
  BookOpen,
  CalendarDays,
  ExternalLink,
  Loader2,
  Microscope,
  Newspaper,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTopics } from "@/hooks/useTopics";
import PageHeader from "@/components/kit/PageHeader";

const ExplorePage = () => {
  const { data: topics = [], isLoading } = useTopics();
  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-enter">
      <PageHeader title="Explore" eyebrow="Topics" subtitle="Planets, missions and discoveries - facts that stay true, updates that don't." />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
            <article
              key={topic.slug}
              className="overflow-hidden rounded-lg border border-border bg-card"
            >
              <div className="h-44 overflow-hidden">
                <img src={topic.image} alt={topic.title} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <p className="telemetry text-primary">{topic.subtitle}</p>
                  <h2 className="font-display text-xl font-semibold text-foreground">{topic.title}</h2>
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

                <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                  <Link
                    to={`/explore/${topic.slug}`}
                    className="text-[13px] font-medium text-primary hover:underline"
                  >
                    Open topic details
                  </Link>
                  {topic.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/hashtag/${tag}`}
                      className="text-[13px] text-primary hover:underline"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
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
          <span key={item} className="rounded-sm border border-border px-2 py-1 text-[11px] text-muted-foreground">
            {item}
          </span>
        ))
      )}
    </div>
  </div>
);

export default ExplorePage;
