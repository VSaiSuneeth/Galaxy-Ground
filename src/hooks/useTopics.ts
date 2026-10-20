import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FALLBACK_TOPICS, type TopicCard } from "@/lib/topics";

const ENABLE_PHASE_B_REMOTE = import.meta.env.VITE_ENABLE_PHASE_B_REMOTE === "true";

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || (error.message || "").toLowerCase().includes("does not exist");
}

async function fetchTopicsFromSupabase(): Promise<TopicCard[] | null> {
  const { data: topics, error } = await supabase
    .from("topics")
    .select("id, slug, title, subtitle, category, hero_image, description, canonical_summary, freshness_label, source_class_label, hashtags, updated_at")
    .order("title");

  if (error) {
    if (isMissingTableError(error)) return null;
    throw error;
  }
  if (!topics?.length) return null;

  const topicIds = topics.map((t) => t.id);
  const [factsRes, timelineRes, researchRes, discoveriesRes] = await Promise.all([
    supabase.from("topic_facts").select("topic_id, label, value, sort_order").in("topic_id", topicIds).order("sort_order"),
    supabase.from("topic_timeline_events").select("topic_id, title, sort_order").in("topic_id", topicIds).order("sort_order"),
    supabase.from("topic_sections").select("topic_id, title, sort_order").eq("section_type", "research").in("topic_id", topicIds).order("sort_order"),
    supabase.from("topic_discoveries").select("topic_id, title, sort_order").in("topic_id", topicIds).order("sort_order"),
  ]);

  if (factsRes.error && !isMissingTableError(factsRes.error)) throw factsRes.error;
  if (timelineRes.error && !isMissingTableError(timelineRes.error)) throw timelineRes.error;
  if (researchRes.error && !isMissingTableError(researchRes.error)) throw researchRes.error;
  if (discoveriesRes.error && !isMissingTableError(discoveriesRes.error)) throw discoveriesRes.error;

  const factsByTopic = new Map<string, string[]>();
  for (const row of factsRes.data || []) {
    const list = factsByTopic.get(row.topic_id) || [];
    list.push(`${row.label}: ${row.value}`);
    factsByTopic.set(row.topic_id, list);
  }

  const timelineByTopic = new Map<string, string[]>();
  for (const row of timelineRes.data || []) {
    const list = timelineByTopic.get(row.topic_id) || [];
    list.push(row.title);
    timelineByTopic.set(row.topic_id, list);
  }

  const researchByTopic = new Map<string, string[]>();
  for (const row of researchRes.data || []) {
    const list = researchByTopic.get(row.topic_id) || [];
    list.push(row.title);
    researchByTopic.set(row.topic_id, list);
  }

  const discoveriesByTopic = new Map<string, string[]>();
  for (const row of discoveriesRes.data || []) {
    const list = discoveriesByTopic.get(row.topic_id) || [];
    list.push(row.title);
    discoveriesByTopic.set(row.topic_id, list);
  }

  return topics.map((topic) => ({
    slug: topic.slug,
    title: topic.title,
    subtitle: topic.subtitle || topic.category || "Space topic",
    description: topic.description || topic.canonical_summary || "",
    image: topic.hero_image || "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=900&q=85",
    updated: topic.freshness_label || `Updated ${new Date(topic.updated_at).toLocaleDateString()}`,
    sourceClass: topic.source_class_label || "Agency and observatory sources",
    facts: factsByTopic.get(topic.id) || [],
    timeline: timelineByTopic.get(topic.id) || [],
    research: researchByTopic.get(topic.id) || [],
    discoveries: discoveriesByTopic.get(topic.id) || [],
    tags: topic.hashtags || [],
    dataSource: "supabase" as const,
  }));
}

export function useTopics() {
  return useQuery({
    queryKey: ["topics"],
    queryFn: async (): Promise<TopicCard[]> => {
      if (!ENABLE_PHASE_B_REMOTE) return FALLBACK_TOPICS;
      try {
        const fromDb = await fetchTopicsFromSupabase();
        if (fromDb?.length) return fromDb;
      } catch {
        // Fall through to static cards when Supabase is unavailable.
      }
      return FALLBACK_TOPICS;
    },
    staleTime: 60_000,
  });
}
