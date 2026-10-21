import {
  BadgeCheck,
  BookOpen,
  Clock,
  Layers,
  Loader2,
  Lock,
  PlayCircle,
  Star,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLearningPaths } from "@/hooks/useLearning";
import PageHeader from "@/components/kit/PageHeader";

const categories = [
  "Space Science",
  "Rocket Engineering",
  "Orbital Mechanics",
  "Satellite Systems",
  "Space Business",
  "Astronomy",
  "Mission Operations",
  "Space Data and AI",
];

const levelColor: Record<string, string> = {
  Beginner: "bg-green-500/15 text-green-400",
  Intermediate: "bg-yellow-500/15 text-yellow-400",
  Advanced: "bg-red-500/15 text-red-400",
};

const LearningPage = () => {
  const { data: paths = [], isLoading } = useLearningPaths();
  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-enter">
      <PageHeader title="Learn" eyebrow="Learning paths" subtitle="Short, curated paths from first look to flight-ready." />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <div key={category} className="rounded-sm border border-border px-3 py-2 text-sm text-foreground">
            {category}
          </div>
        ))}
      </section>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
      <section className="grid gap-4 md:grid-cols-2">
        {paths.map((path) => (
          <article
            key={path.slug}
            className="rounded-lg border border-border bg-card p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-semibold text-foreground">{path.title}</h2>
              </div>
              {path.premiumReady ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 px-2 py-1 text-[10px] text-purple-300">
                  <Lock className="h-3 w-3" />
                  Future premium
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[10px] text-primary">
                  <BadgeCheck className="h-3 w-3" />
                  Free path
                </span>
              )}
            </div>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{path.summary}</p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${levelColor[path.level] || "bg-muted/60 text-muted-foreground"}`}>
                {path.level}
              </span>
              {path.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {path.duration}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {path.learners}
              </span>
              <span className="flex items-center gap-1 text-yellow-400">
                <Star className="h-3.5 w-3.5 fill-current" />
                {path.rating}
              </span>
            </div>

            <LearningList icon={<Layers className="h-4 w-4" />} title="Modules" items={path.modules} />
            <LearningList icon={<PlayCircle className="h-4 w-4" />} title="Curated Videos" items={path.videos} />

            <Link
              to={`/learning/${path.slug}`}
              className="mt-4 inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              Open learning path
            </Link>
          </article>
        ))}
      </section>
      )}
    </div>
  );
};

const LearningList = ({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) => (
  <div className="mt-4 border-t border-border pt-4">
    <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
      <span className="text-primary">{icon}</span>
      {title}
    </div>
    <div className="space-y-1.5">
      {items.map((item) => (
        <div key={item} className="rounded-md bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground">
          {item}
        </div>
      ))}
    </div>
  </div>
);

export default LearningPage;
