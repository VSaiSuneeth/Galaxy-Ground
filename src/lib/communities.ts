// Maps Community slugs (used in URLs) to the canonical themed_accounts.category
// AND to a list of related startup categories. Used by CommunitiesPage and
// CommunityDetailPage to unify creators + startups + posts under one page.

export interface CommunityMeta {
  slug: string;
  name: string;
  description: string;
  icon: string;
  /** Categories from `themed_accounts.category` to include */
  themedCategories: string[];
  /** Categories from `startups.category` to include (substring match) */
  startupCategoryMatches: string[];
  /** Hashtag keywords to also include in this community's feed */
  hashtagMatches: string[];
}

export const COMMUNITY_META: CommunityMeta[] = [
  {
    slug: "astrophotography",
    name: "Astrophotography",
    description: "Capture the cosmos. Deep-sky, planetary, and wide-field shots — gear talk, processing tips and clear skies.",
    icon: "📷",
    themedCategories: ["Astrophotography"],
    startupCategoryMatches: [],
    hashtagMatches: ["astrophotography", "nebula", "galaxy", "milkyway", "moon", "stars"],
  },
  {
    slug: "rocket-engineering",
    name: "Rocket Engineering",
    description: "Propulsion, structures, GNC and avionics. Hardware-rich discussion for builders and engineers.",
    icon: "🚀",
    themedCategories: ["Rocket Engineering"],
    startupCategoryMatches: ["launch", "rocket", "propulsion"],
    hashtagMatches: ["rocket", "propulsion", "launch", "engine", "thrust", "orbit"],
  },
  {
    slug: "space-policy",
    name: "Space Policy & Law",
    description: "Treaties, regulation, commercial frameworks and geopolitics of the new space age.",
    icon: "⚖️",
    themedCategories: ["Space Policy and Law"],
    startupCategoryMatches: [],
    hashtagMatches: ["spacepolicy", "spacelaw", "regulation", "treaty"],
  },
  {
    slug: "astrobiology",
    name: "Astrobiology",
    description: "Search for life beyond Earth — biosignatures, extremophiles, exoplanet atmospheres.",
    icon: "🧬",
    themedCategories: ["Astrobiology"],
    startupCategoryMatches: [],
    hashtagMatches: ["astrobiology", "life", "extremophile", "exoplanet", "habitable"],
  },
  {
    slug: "mass-society",
    name: "Mass Society",
    description: "The cultural and societal side of space — exploration, education, and community.",
    icon: "🌍",
    themedCategories: ["Mass Society"],
    startupCategoryMatches: [],
    hashtagMatches: ["space", "education", "community", "exploration"],
  },
  {
    slug: "satellite-tech",
    name: "Satellite Tech",
    description: "CubeSats, mega-constellations, remote sensing, and smallsat engineering.",
    icon: "🛰️",
    themedCategories: ["Satellite Tech"],
    startupCategoryMatches: ["satellite", "earth observation", "geospatial", "smallsat"],
    hashtagMatches: ["satellite", "earthobservation", "communication", "orbit"],
  },
  {
    slug: "indian-space-program",
    name: "Indian Space Program",
    description: "ISRO, Skyroot, Agnikul, and the growing Indian private space ecosystem.",
    icon: "🇮🇳",
    themedCategories: ["Indian Space Program"],
    startupCategoryMatches: [],
    hashtagMatches: ["isro", "india", "chandrayaan", "gaganyaan", "pslv", "gslv"],
  },
  {
    slug: "deep-space-exploration",
    name: "Deep Space Exploration",
    description: "Interplanetary missions, deep-space probes, and the future of space travel.",
    icon: "🌌",
    themedCategories: ["Deep Space Exploration"],
    startupCategoryMatches: [],
    hashtagMatches: ["deepspace", "probe", "interstellar", "voyager", "jupiter", "saturn"],
  },
];

export const COMMUNITY_BY_SLUG: Record<string, CommunityMeta> = COMMUNITY_META.reduce(
  (acc, c) => {
    acc[c.slug] = c;
    return acc;
  },
  {} as Record<string, CommunityMeta>
);
