import {
  BadgeCheck,
  BookOpen,
  Clock,
  GraduationCap,
  Layers,
  Loader2,
  Lock,
  PlayCircle,
  Star,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useLearningPaths } from "@/hooks/useLearning";

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
  const usingSupabase = paths.some((path) => path.dataSource === "supabase");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="glass-panel p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground glow-text">Learning Hub</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Curated space education paths for learners, builders, and future instructors. The current page focuses on
              free structured learning while leaving clean room for paid courses later.
            </p>
          </div>
          <div className="rounded-xl border border-glass-border bg-muted/30 p-4 text-sm">
            <p className="font-medium text-foreground">MVP learning mode</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Free paths first, paid courses after backend enrollments, instructors, purchases, and certificates exist.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <div key={category} className="rounded-lg border border-glass-border bg-card/60 p-3 text-sm text-foreground">
            {category}
          </div>
        ))}
      </section>

      {isLoading ? (
        <div className="glass-panel flex justify-center p-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
      <section className="grid gap-4 md:grid-cols-2">
        {paths.map((path, index) => (
          <motion.article
            key={path.slug}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className="glass-panel p-5"
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
          </motion.article>
        ))}
      </section>
      )}

      <section className="glass-panel p-5">
        <h2 className="font-semibold text-foreground">Data source</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {usingSupabase
            ? "Learning paths are reading free courses, modules, and lessons from Supabase."
            : "Learning paths are using local fallback data until Supabase course tables are applied."}
          {" "}Payments, instructors, and certificates remain future work.
        </p>
      </section>
    </div>
  );
};

const LearningList = ({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) => (
  <div className="mt-4 border-t border-glass-border pt-4">
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
