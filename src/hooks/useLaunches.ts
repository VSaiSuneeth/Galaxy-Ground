import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  LAUNCHES,
  getCountdownParts,
  getLaunchBySlug as getStaticLaunchBySlug,
  getUpcomingLaunches as getStaticUpcomingLaunches,
  type Launch,
  type LaunchDetail,
  type LaunchStatus,
} from "@/lib/launches";
import { asArray } from "@/lib/safe-data";

const ENABLE_PHASE_B_REMOTE = import.meta.env.VITE_ENABLE_PHASE_B_REMOTE === "true";

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || (error.message || "").toLowerCase().includes("does not exist");
}

function mapDbStatus(status: string): LaunchStatus {
  switch (status) {
    case "scheduled":
    case "in_preparation":
      return "GO";
    case "delayed":
    case "scrubbed":
    case "failed":
      return "HOLD";
    case "announced":
      return "NET";
    default:
      return "TBD";
  }
}

function mapDbRowToLaunch(row: {
  slug: string;
  name: string;
  provider: string;
  vehicle: string | null;
  launch_date: string;
  location: string | null;
  payload: string | null;
  status: string;
  description: string | null;
  livestream_url?: string | null;
}): Launch {
  return {
    slug: row.slug,
    missionName: row.name,
    rocket: row.vehicle || "TBD",
    agency: row.provider,
    launchDate: row.launch_date,
    pad: row.location || "TBD",
    payload: row.payload || "TBD",
    status: mapDbStatus(row.status),
    description: row.description || "",
    sourceLink: row.livestream_url || undefined,
    dataSource: "supabase",
  };
}

async function fetchLaunchesFromSupabase(): Promise<Launch[] | null> {
  const { data, error } = await supabase
    .from("launches")
    .select("slug, name, provider, vehicle, launch_date, location, payload, status, description, livestream_url")
    .order("launch_date", { ascending: true });

  if (error) {
    if (isMissingTableError(error)) return null;
    throw error;
  }
  if (!data?.length) return null;
  return data.map(mapDbRowToLaunch);
}

async function fetchLaunchDetailFromSupabase(slug: string): Promise<LaunchDetail | null> {
  const { data: launch, error } = await supabase
    .from("launches")
    .select("id, slug, name, provider, vehicle, launch_date, location, payload, status, description, livestream_url")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) return null;
    throw error;
  }
  if (!launch) return null;

  const [updatesRes, sourcesRes] = await Promise.all([
    supabase
      .from("launch_updates")
      .select("title, summary, source_url, published_at, update_type")
      .eq("launch_id", launch.id)
      .order("published_at", { ascending: false })
      .limit(10),
    supabase
      .from("launch_sources")
      .select("source_name, source_type, url, trust_level")
      .eq("launch_id", launch.id)
      .order("trust_level", { ascending: false }),
  ]);

  if (updatesRes.error && !isMissingTableError(updatesRes.error)) throw updatesRes.error;
  if (sourcesRes.error && !isMissingTableError(sourcesRes.error)) throw sourcesRes.error;

  const base = mapDbRowToLaunch(launch);
  const primarySource = sourcesRes.data?.[0];

  return {
    ...base,
    sourceLink: primarySource?.url || base.sourceLink,
    timeline: (updatesRes.data || []).map((u) => u.title),
    updates: (updatesRes.data || []).map((u) => ({
      title: u.title,
      body: u.summary || "No summary provided.",
      sourceUrl: u.source_url || undefined,
      publishedAt: u.published_at,
      updateType: u.update_type,
    })),
    sources: (sourcesRes.data || []).map((s) => ({
      name: s.source_name,
      type: s.source_type,
      url: s.url,
      trustLevel: s.trust_level,
    })),
    relatedPosts: [],
    dataSource: "supabase",
  };
}

export function useLaunches() {
  return useQuery({
    queryKey: ["launches"],
    queryFn: async (): Promise<Launch[]> => {
      if (!ENABLE_PHASE_B_REMOTE) {
        return LAUNCHES.map((launch) => ({ ...launch, dataSource: "fallback" as const }));
      }
      try {
        const fromDb = await fetchLaunchesFromSupabase();
        if (fromDb?.length) return fromDb;
      } catch {
        // Use static fallback when remote tables are unavailable.
      }
      return LAUNCHES.map((launch) => ({ ...launch, dataSource: "fallback" as const }));
    },
    staleTime: 60_000,
  });
}

export function useLaunch(slug: string) {
  return useQuery({
    queryKey: ["launch", slug],
    enabled: !!slug,
    queryFn: async (): Promise<LaunchDetail | null> => {
      if (ENABLE_PHASE_B_REMOTE) {
        try {
          const fromDb = await fetchLaunchDetailFromSupabase(slug);
          if (fromDb) return fromDb;
        } catch {
          // Fall through to static launch detail.
        }
      }
      const fallback = getStaticLaunchBySlug(slug);
      if (!fallback) return null;
      return {
        ...fallback,
        dataSource: "fallback",
        timeline: [
          "Mission objective and provider tracking created",
          "Launch vehicle and payload context added",
          "Countdown follows the current planned launch window",
          "Official updates can be attached after launch backend tables exist",
        ],
        updates: [
          {
            title: "Official schedule monitoring",
            body: "Use provider or agency sources as the source of truth when Supabase launch ingestion is added.",
          },
          {
            title: "Galaxy Ground related posts",
            body: "Startup and community posts can be matched to this mission after mission-entity linking exists.",
          },
        ],
        sources: [],
        relatedPosts: [],
      };
    },
    staleTime: 60_000,
  });
}

export function useUpcomingLaunches(limit?: number) {
  const { data: launches = [] } = useLaunches();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  return useMemo(() => {
    const now = Date.now();
    const upcoming = [...launches]
      .filter((launch) => new Date(launch.launchDate).getTime() > now)
      .sort((a, b) => new Date(a.launchDate).getTime() - new Date(b.launchDate).getTime());
    return typeof limit === "number" ? upcoming.slice(0, limit) : upcoming;
  }, [launches, limit, tick]);
}

export function useLaunchCountdown(launchDate: string) {
  const [parts, setParts] = useState(() => getCountdownParts(launchDate));

  useEffect(() => {
    const update = () => setParts(getCountdownParts(launchDate));
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, [launchDate]);

  return parts;
}

/** Static-only helper kept for legacy imports. */
export function getUpcomingLaunchesStatic(limit?: number) {
  return getStaticUpcomingLaunches(limit);
}
