import { ArrowLeft, BookOpen, CheckCircle2, Clock, GraduationCap, Loader2, PlayCircle, Star, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { useLearningPaths } from "@/hooks/useLearning";
import {
  LEARNING_PROGRESS_STORAGE_KEY,
  getLearningPathBySlug,
  getLearningProgressPercent,
  parseLearningProgress,
  serializeLearningProgress,
  toggleLearningProgressItem,
  type LearningProgressState,
} from "@/lib/learning";

const LearningDetailPage = () => {
  const { slug = "" } = useParams();
  const { data: paths = [], isLoading } = useLearningPaths();
  const path = getLearningPathBySlug(slug, paths);
  const [completed, setCompleted] = useState<LearningProgressState>(() => {
    if (typeof window === "undefined") return {};
    return parseLearningProgress(window.localStorage.getItem(LEARNING_PROGRESS_STORAGE_KEY));
  });

  const progressPercent = useMemo(() => {
    if (!path) return 0;
    return getLearningProgressPercent(path.modules, completed[slug] ?? []);
  }, [completed, path, slug]);

  useEffect(() => {
    window.localStorage.setItem(LEARNING_PROGRESS_STORAGE_KEY, serializeLearningProgress(completed));
  }, [completed]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl glass-panel p-10 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!path) {
    return (
      <div className="mx-auto max-w-3xl glass-panel p-8 text-center text-sm text-muted-foreground">
        Learning path not found.
      </div>
    );
  }

  const toggleItem = (item: string) => {
    setCompleted((current) => toggleLearningProgressItem(current, slug, item));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link to="/learning" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-3.5 w-3.5" /> All learning paths
      </Link>

      <section className="glass-panel p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{path.title}</h1>
              <p className="text-sm text-muted-foreground">{path.level} · {path.duration}</p>
            </div>
          </div>

          <div className="rounded-xl border border-glass-border bg-muted/30 p-4 text-sm">
            <p className="font-medium text-foreground">Progress</p>
            <p className="mt-1 text-xs text-muted-foreground">{progressPercent}% complete</p>
            <Progress value={progressPercent} className="mt-3" />
          </div>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-foreground/80">{path.summary}</p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-primary">
            <Users className="h-3.5 w-3.5" />
            {path.learners} learners
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-primary">
            <Clock className="h-3.5 w-3.5" />
            {path.duration}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-primary">
            <Star className="h-3.5 w-3.5 fill-current" />
            {path.rating}
          </span>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="glass-panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Modules</h2>
          </div>
          <div className="space-y-2">
            {path.modules.map((module) => {
              const isComplete = (completed[slug] ?? []).includes(module);
              return (
                <button
                  key={module}
                  type="button"
                  onClick={() => toggleItem(module)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                    isComplete
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                      : "border-glass-border bg-muted/30 text-foreground"
                  }`}
                >
                  <span>{module}</span>
                  {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <Loader2 className="h-4 w-4 opacity-50" />}
                </button>
              );
            })}
          </div>
        </section>

        <section className="glass-panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Curated videos</h2>
          </div>
          <div className="space-y-2">
            {path.videos.map((video) => (
              <div key={video} className="rounded-lg border border-glass-border bg-muted/30 px-3 py-2 text-sm text-foreground">
                {video}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default LearningDetailPage;
