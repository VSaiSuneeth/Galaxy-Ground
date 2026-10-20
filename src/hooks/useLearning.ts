import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LEARNING_PATHS, type LearningPathDetail } from "@/lib/learning";

const ENABLE_PHASE_B_REMOTE = import.meta.env.VITE_ENABLE_PHASE_B_REMOTE === "true";

export interface LearningPathCard extends LearningPathDetail {
  dataSource: "supabase" | "fallback";
}

const FALLBACK_PATHS: LearningPathCard[] = LEARNING_PATHS.map((path) => ({
  ...path,
  dataSource: "fallback",
}));

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || (error.message || "").toLowerCase().includes("does not exist");
}

export function useLearningPaths() {
  return useQuery({
    queryKey: ["learning-paths"],
    queryFn: async (): Promise<LearningPathCard[]> => {
      if (!ENABLE_PHASE_B_REMOTE) return FALLBACK_PATHS;

      const { data: courses, error } = await supabase
        .from("courses")
        .select("id, slug, title, summary, category, level, duration_label, learner_count_label, rating")
        .order("sort_order");

      if (error) {
        if (isMissingTableError(error)) return FALLBACK_PATHS;
        throw error;
      }
      if (!courses?.length) return FALLBACK_PATHS;

      const courseIds = courses.map((c) => c.id);
      const [modulesRes, lessonsRes] = await Promise.all([
        supabase.from("course_modules").select("course_id, title, sort_order").in("course_id", courseIds).order("sort_order"),
        supabase.from("course_lessons").select("course_id, title, sort_order").in("course_id", courseIds).order("sort_order"),
      ]);

      if (modulesRes.error && !isMissingTableError(modulesRes.error)) throw modulesRes.error;
      if (lessonsRes.error && !isMissingTableError(lessonsRes.error)) throw lessonsRes.error;

      const modulesByCourse = new Map<string, string[]>();
      for (const row of modulesRes.data || []) {
        const list = modulesByCourse.get(row.course_id) || [];
        list.push(row.title);
        modulesByCourse.set(row.course_id, list);
      }

      const videosByCourse = new Map<string, string[]>();
      for (const row of lessonsRes.data || []) {
        const list = videosByCourse.get(row.course_id) || [];
        list.push(row.title);
        videosByCourse.set(row.course_id, list);
      }

      return courses.map((course) => ({
        slug: course.slug,
        title: course.title,
        summary: course.summary || "",
        level: course.level,
        duration: course.duration_label || "Self-paced",
        learners: course.learner_count_label || "—",
        rating: Number(course.rating) || 4.8,
        modules: modulesByCourse.get(course.id) || [],
        videos: videosByCourse.get(course.id) || [],
        tags: course.category ? [course.category] : [],
        premiumReady: false,
        dataSource: "supabase" as const,
      }));
    },
    staleTime: 60_000,
  });
}
