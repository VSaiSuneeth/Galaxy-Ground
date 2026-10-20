export type LaunchStatus = "GO" | "TBD" | "NET" | "HOLD";

export interface LaunchFilters {
  status?: LaunchStatus | "ALL";
  agency?: string;
}

export interface LaunchMonthGroup {
  month: string;
  launches: Launch[];
}

export interface Launch {
  slug: string;
  missionName: string;
  rocket: string;
  agency: string;
  launchDate: string;
  pad: string;
  payload: string;
  status: LaunchStatus;
  description: string;
  sourceLink?: string;
  dataSource?: "supabase" | "fallback";
}

export interface LaunchUpdateCard {
  title: string;
  body: string;
  sourceUrl?: string;
  publishedAt?: string;
  updateType?: string;
}

export interface LaunchSource {
  name: string;
  type: string;
  url: string | null;
  trustLevel: number;
}

export interface RelatedPostCard {
  id: string;
  title: string;
  content: string;
  summary: string;
  sourceUrl?: string | null;
  imageUrl?: string | null;
  publishedAt?: string;
  startupName: string | null;
  startupSlug: string | null;
}

export interface LaunchDetail extends Launch {
  timeline: string[];
  updates: LaunchUpdateCard[];
  sources: LaunchSource[];
  relatedPosts: RelatedPostCard[];
}

export const LAUNCHES: Launch[] = [
  {
    slug: "isro-gaganyaan-g1",
    missionName: "Gaganyaan G1",
    rocket: "LVM3",
    agency: "ISRO",
    launchDate: "2026-07-15T04:30:00Z",
    pad: "Satish Dhawan Space Centre, India",
    payload: "Uncrewed orbital test flight",
    status: "NET",
    description:
      "Uncrewed flight test for India's human spaceflight program, validating systems needed before future crewed missions.",
  },
  {
    slug: "spacex-starship-flight-test",
    missionName: "Starship Flight Test",
    rocket: "Starship",
    agency: "SpaceX",
    launchDate: "2026-08-02T12:00:00Z",
    pad: "Starbase, Texas",
    payload: "Integrated vehicle test",
    status: "TBD",
    description:
      "Integrated Starship and Super Heavy test campaign focused on reusability, ascent performance, and recovery operations.",
  },
  {
    slug: "rocket-lab-neutron-demo",
    missionName: "Neutron Demo Mission",
    rocket: "Neutron",
    agency: "Rocket Lab",
    launchDate: "2026-09-10T16:00:00Z",
    pad: "Wallops Island, Virginia",
    payload: "Reusable medium-lift demonstration",
    status: "NET",
    description:
      "Technology demonstration for Rocket Lab's reusable medium-lift vehicle aimed at constellation and national security missions.",
  },
  {
    slug: "ariane-6-commercial-rideshare",
    missionName: "Ariane 6 Commercial Rideshare",
    rocket: "Ariane 6",
    agency: "Arianespace",
    launchDate: "2026-10-21T19:15:00Z",
    pad: "Guiana Space Centre, French Guiana",
    payload: "Commercial rideshare payloads",
    status: "TBD",
    description:
      "Commercial rideshare mission expanding Ariane 6 launch cadence for institutional and private small satellite customers.",
  },
  {
    slug: "blue-origin-new-glenn-mission",
    missionName: "New Glenn Customer Mission",
    rocket: "New Glenn",
    agency: "Blue Origin",
    launchDate: "2026-11-18T13:00:00Z",
    pad: "LC-36, Cape Canaveral",
    payload: "Commercial payload",
    status: "TBD",
    description:
      "Heavy-lift commercial mission targeting reusable first-stage operations and large payload delivery to orbit.",
  },
];

export function getLaunchBySlug(slug: string | undefined) {
  if (!slug) return null;
  return LAUNCHES.find((launch) => launch.slug === slug) ?? null;
}

export function getUpcomingLaunches(limit?: number) {
  const now = Date.now();
  const launches = [...LAUNCHES]
    .filter((launch) => new Date(launch.launchDate).getTime() > now)
    .sort((a, b) => new Date(a.launchDate).getTime() - new Date(b.launchDate).getTime());
  return typeof limit === "number" ? launches.slice(0, limit) : launches;
}

export function formatLaunchDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function getCountdownParts(iso: string) {
  const diff = Math.max(0, new Date(iso).getTime() - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    isLive: diff === 0,
  };
}

export function formatCompactCountdown(iso: string) {
  const parts = getCountdownParts(iso);
  if (parts.isLive) return "Live";
  if (parts.days > 0) return `${parts.days}d ${parts.hours}h`;
  if (parts.hours > 0) return `${parts.hours}h ${parts.minutes}m`;
  return `${parts.minutes}m ${parts.seconds}s`;
}

export function filterLaunches(launches: Launch[], filters: LaunchFilters) {
  return launches.filter((launch) => {
    const matchesStatus = filters.status && filters.status !== "ALL" ? launch.status === filters.status : true;
    const matchesAgency = filters.agency ? launch.agency.toLowerCase() === filters.agency.toLowerCase() : true;
    return matchesStatus && matchesAgency;
  });
}

export function groupLaunchesByMonth(launches: Launch[]): LaunchMonthGroup[] {
  const grouped = new Map<string, Launch[]>();

  launches.forEach((launch) => {
    const date = new Date(launch.launchDate);
    const monthKey = date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    const existing = grouped.get(monthKey) ?? [];
    existing.push(launch);
    grouped.set(monthKey, existing);
  });

  return Array.from(grouped.entries())
    .sort(([monthA], [monthB]) => new Date(`${monthA} 01`).getTime() - new Date(`${monthB} 01`).getTime())
    .map(([month, groupedLaunches]) => ({
      month,
      launches: groupedLaunches.sort((a, b) => new Date(a.launchDate).getTime() - new Date(b.launchDate).getTime()),
    }));
}
