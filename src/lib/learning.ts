export interface LearningPathDetail {
  slug: string;
  title: string;
  summary: string;
  level: string;
  duration: string;
  learners: string;
  rating: number;
  modules: string[];
  videos: string[];
  tags: string[];
  premiumReady?: boolean;
  dataSource?: "supabase" | "fallback";
}

export interface LearningProgressState {
  [slug: string]: string[];
}

export const LEARNING_PROGRESS_STORAGE_KEY = "galaxy-ground-learning-progress";

export const LEARNING_PATHS: LearningPathDetail[] = [
  {
    slug: "rocket-propulsion-fundamentals",
    title: "Rocket Propulsion Fundamentals",
    summary:
      "A guided path through thrust, specific impulse, combustion chambers, electric propulsion, and mission tradeoffs.",
    level: "Intermediate",
    duration: "12 hours",
    learners: "8.2k",
    rating: 4.8,
    modules: ["Thrust basics", "Chemical engines", "Electric propulsion", "Testing and safety"],
    videos: ["Engine cycles overview", "Ion thruster explainer"],
    tags: ["Engineering", "Physics"],
    dataSource: "fallback",
  },
  {
    slug: "orbital-mechanics-101",
    title: "Orbital Mechanics 101",
    summary:
      "Build intuition for Keplerian orbits, transfer windows, delta-v budgets, rendezvous, and mission planning.",
    level: "Beginner",
    duration: "8 hours",
    learners: "12.4k",
    rating: 4.9,
    modules: ["Orbit shapes", "Hohmann transfers", "Plane changes", "Mission examples"],
    videos: ["Why orbits work", "Transfer orbit walkthrough"],
    tags: ["Astrodynamics", "Mathematics"],
    dataSource: "fallback",
  },
  {
    slug: "satellite-systems",
    title: "Satellite Systems",
    summary:
      "Understand spacecraft subsystems from payload and power to thermal control, ADCS, communications, and operations.",
    level: "Advanced",
    duration: "20 hours",
    learners: "5.1k",
    rating: 4.7,
    modules: ["Mission requirements", "Bus subsystems", "Ground segment", "Operations"],
    videos: ["Spacecraft bus tour", "ADCS fundamentals"],
    tags: ["Satellites", "Systems"],
    premiumReady: true,
    dataSource: "fallback",
  },
];

export function getLearningPathBySlug(slug: string | undefined, paths: LearningPathDetail[] = LEARNING_PATHS) {
  if (!slug) return null;
  return paths.find((path) => path.slug === slug) ?? null;
}

export function getLearningProgressPercent(totalItems: string[], completedItems: string[]) {
  if (!totalItems.length) return 0;
  const validCompleted = new Set(completedItems.filter((item) => totalItems.includes(item)));
  return Math.round((validCompleted.size / totalItems.length) * 100);
}

export function toggleLearningProgressItem(
  progress: LearningProgressState,
  slug: string,
  item: string,
): LearningProgressState {
  const completed = progress[slug] ?? [];
  const nextCompleted = completed.includes(item) ? completed.filter((value) => value !== item) : [...completed, item];

  return {
    ...progress,
    [slug]: nextCompleted,
  };
}

export function parseLearningProgress(raw: string | null): LearningProgressState {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    const record = parsed as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(record)
        .filter((entry): entry is [string, unknown[]] => Array.isArray(entry[1]))
        .map(([slug, items]) => [slug, items.filter((item): item is string => typeof item === "string")]),
    );
  } catch {
    return {};
  }
}

export function serializeLearningProgress(progress: LearningProgressState): string {
  return JSON.stringify(progress);
}
