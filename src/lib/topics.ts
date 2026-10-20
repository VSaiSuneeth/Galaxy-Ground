export interface TopicCard {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  updated: string;
  sourceClass: string;
  facts: string[];
  timeline: string[];
  research: string[];
  discoveries: string[];
  tags: string[];
  dataSource: "supabase" | "fallback";
}

export const FALLBACK_TOPICS: TopicCard[] = [
  {
    slug: "mars",
    title: "Mars",
    subtitle: "Planetary exploration",
    description:
      "A living research target for rover science, sample-return planning, human mission design, and in-situ resource studies.",
    image: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=900&q=80",
    updated: "Evergreen profile with mission-watch updates",
    sourceClass: "Agency and observatory sources",
    facts: ["Diameter: 6,779 km", "Gravity: 3.72 m/s2", "Moons: 2"],
    timeline: ["Mariner flybys", "Viking landers", "Spirit and Opportunity", "Curiosity and Perseverance"],
    research: ["Habitability studies", "Sample caching", "Atmospheric loss", "ISRU experiments"],
    discoveries: ["Ancient water signatures", "Seasonal atmospheric cycles", "Subsurface ice evidence"],
    tags: ["mars", "planetaryscience", "rovers"],
    dataSource: "fallback",
  },
  {
    slug: "moon",
    title: "The Moon",
    subtitle: "Crewed return and lunar economy",
    description:
      "Earth's nearest world is becoming a testbed for landing systems, surface power, habitats, communications, and science operations.",
    image: "https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?w=900&q=80",
    updated: "Watchlist for Artemis and commercial lunar missions",
    sourceClass: "Official mission sources",
    facts: ["Diameter: 3,474 km", "Gravity: 1.62 m/s2", "Distance: 384,400 km"],
    timeline: ["Apollo landings", "Lunar Reconnaissance Orbiter", "Artemis I", "Commercial lander attempts"],
    research: ["Lunar south pole", "Volatiles", "Regolith operations", "Surface power"],
    discoveries: ["Water ice indicators", "Permanently shadowed regions", "Young volcanic terrain"],
    tags: ["moon", "artemis", "lunar"],
    dataSource: "fallback",
  },
  {
    slug: "iss",
    title: "ISS",
    subtitle: "Orbital laboratory",
    description:
      "A long-duration platform for microgravity science, commercial spaceflight operations, life-support research, and international crew missions.",
    image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=900&q=80",
    updated: "Operational topic with frequent crew and cargo updates",
    sourceClass: "Agency operations sources",
    facts: ["Altitude: about 408 km", "Speed: 27,600 km/h", "Crew: 6-7"],
    timeline: ["First module launched", "Continuous crew presence", "Commercial crew", "Private astronaut missions"],
    research: ["Human health", "Fluid physics", "Materials", "Plant growth"],
    discoveries: ["Microgravity adaptation data", "Protein crystal studies", "Combustion behavior"],
    tags: ["iss", "microgravity", "humanflight"],
    dataSource: "fallback",
  },
  {
    slug: "jupiter",
    title: "Jupiter",
    subtitle: "Gas giant system",
    description:
      "A complex planetary system whose moons, magnetic field, and atmosphere reveal how giant planets shape habitability zones.",
    image: "https://images.unsplash.com/photo-1630839437035-dac17da580d0?w=900&q=80",
    updated: "Evergreen profile with mission context",
    sourceClass: "Planetary science sources",
    facts: ["Diameter: 139,820 km", "Gravity: 24.79 m/s2", "Moons: 95+"],
    timeline: ["Pioneer flybys", "Voyager flybys", "Galileo orbiter", "Juno mission"],
    research: ["Magnetosphere", "Storm systems", "Europa habitability", "Interior structure"],
    discoveries: ["Great Red Spot evolution", "Auroral activity", "Ocean-world moon evidence"],
    tags: ["jupiter", "europa", "planetaryscience"],
    dataSource: "fallback",
  },
];

export const EXPLORE_SOURCE_PILLS = [
  "Official agency",
  "Observatory release",
  "Scientific report",
  "Galaxy Ground summary",
];

export function findTopicBySlug(topics: TopicCard[], slug?: string) {
  if (!slug) return null;
  return topics.find((topic) => topic.slug === slug) ?? null;
}
