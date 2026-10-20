// Static reference data for hashtags, launches, communities, startups.
// Keeps detail pages working without external APIs.

export const TRENDING_TOPICS: Record<string, { tag: string; description: string; posts: string }> = {
  marscolony: {
    tag: "#MarsColony",
    posts: "2.4k",
    description: "Discussions on permanent human settlement on Mars — habitats, ISRU, life support and crewed missions.",
  },
  jameswebbtelescope: {
    tag: "#JamesWebbTelescope",
    posts: "1.8k",
    description: "Latest images, spectra and discoveries from NASA's flagship infrared observatory.",
  },
  spacexstarship: {
    tag: "#SpaceXStarship",
    posts: "3.1k",
    description: "Starship test campaigns, Raptor engines, orbital flights and Mars architecture.",
  },
  lunargateway: {
    tag: "#LunarGateway",
    posts: "890",
    description: "The cislunar Gateway station: HALO, PPE, international modules and Artemis logistics.",
  },
  darkmatter: {
    tag: "#DarkMatter",
    posts: "1.2k",
    description: "Theory and detection efforts: WIMPs, axions, MACHOs and modified gravity.",
  },
};

export const LAUNCHES: Record<string, {
  name: string;
  vehicle: string;
  date: string;
  countdown: string;
  pad: string;
  payload: string;
  details: string;
}> = {
  "falcon-9-starlink": {
    name: "Falcon 9 — Starlink",
    vehicle: "Falcon 9 Block 5",
    date: "Apr 5, 2026",
    countdown: "5d 12h",
    pad: "SLC-40, Cape Canaveral",
    payload: "23× Starlink v2-mini satellites",
    details: "Routine Starlink batch. Booster B1078 expected to perform an ASDS landing on 'A Shortfall of Gravitas'.",
  },
  "vikram-ii-skyroot": {
    name: "Vikram-II — Skyroot",
    vehicle: "Vikram-II",
    date: "Apr 12, 2026",
    countdown: "12d 8h",
    pad: "Sriharikota, India",
    payload: "Tech demo + small-sat rideshare",
    details: "First Skyroot orbital attempt. Three-stage solid + liquid configuration; targets 500 km SSO.",
  },
  "agnibaan-agnikul": {
    name: "Agnibaan — Agnikul",
    vehicle: "Agnibaan SOrTeD",
    date: "Apr 20, 2026",
    countdown: "20d 3h",
    pad: "Agnikul Pvt Launchpad, Sriharikota",
    payload: "Sub-orbital tech demo",
    details: "Single-stage flight using a 3D-printed Agnilet engine. Configurable architecture for 30-300 kg payloads.",
  },
  "vikram-ii-orbital-test": {
    name: "Vikram-II Orbital Test",
    vehicle: "Vikram-II",
    date: "April 5, 2026",
    countdown: "5d",
    pad: "Sriharikota, India",
    payload: "Tech demo + small-sat rideshare",
    details: "Second orbital test flight of the Vikram-II small satellite launch vehicle by Skyroot Aerospace.",
  },
  "agnibaan-sorted-mission": {
    name: "Agnibaan SOrTeD Mission",
    vehicle: "Agnibaan SOrTeD",
    date: "April 12, 2026",
    countdown: "12d",
    pad: "Sriharikota, India",
    payload: "Sub-orbital tech demo",
    details: "Sub-orbital test featuring the world's first single-piece 3D-printed Agnilet engine.",
  },
  "falcon-9-starlink-g12-5": {
    name: "Falcon 9 — Starlink G12-5",
    vehicle: "Falcon 9 Block 5",
    date: "April 18, 2026",
    countdown: "18d",
    pad: "Cape Canaveral, FL",
    payload: "Starlink V2 mini batch",
    details: "Batch deployment of next-generation Starlink V2 mini satellites.",
  },
  "ariane-6-a64": {
    name: "Ariane 6 — A64",
    vehicle: "Ariane 6 (A64)",
    date: "May 2, 2026",
    countdown: "32d",
    pad: "Kourou, French Guiana",
    payload: "ESA science payload",
    details: "Heavy configuration launch carrying an ESA science payload.",
  },
};

export const COMMUNITIES: Record<string, {
  name: string;
  members: string;
  description: string;
  topics: string[];
}> = {
  astrophotography: {
    name: "Astrophotography",
    members: "45.2k",
    description: "Capture the cosmos. Share your deep-sky, planetary, and wide-field shots — gear talk, processing tips and clear skies.",
    topics: ["DSO", "Planetary", "Solar", "Processing", "Mounts"],
  },
  "rocket-engineering": {
    name: "Rocket Engineering",
    members: "32.1k",
    description: "Propulsion, structures, GNC and avionics. Hardware-rich discussion for builders and engineers.",
    topics: ["Propulsion", "Structures", "GNC", "Avionics", "Test"],
  },
  "space-policy": {
    name: "Space Policy",
    members: "18.9k",
    description: "Treaties, regulation, commercial frameworks and geopolitics of the new space age.",
    topics: ["Artemis Accords", "OST", "Spectrum", "ITAR"],
  },
  astrobiology: {
    name: "Astrobiology",
    members: "12.4k",
    description: "Search for life beyond Earth — biosignatures, extremophiles, exoplanet atmospheres.",
    topics: ["Biosignatures", "Exoplanets", "Mars", "Europa"],
  },
};

export const STARTUPS: Record<string, {
  name: string;
  status: string;
  founded: string;
  hq: string;
  focus: string;
  description: string;
  highlights: string[];
}> = {
  "skyroot-aerospace": {
    name: "Skyroot Aerospace",
    status: "Launch prep",
    founded: "2018",
    hq: "Hyderabad, India",
    focus: "Small-satellite launch vehicles",
    description:
      "India's first private rocket company. Built Vikram-S (first private Indian rocket to reach space, 2022) and is preparing Vikram-I/II for orbital service.",
    highlights: [
      "First private Indian rocket to space (Vikram-S, 2022)",
      "Dhawan-II cryogenic engine hot-fire complete",
      "Targeting 480 kg to 500 km SSO with Vikram-I",
    ],
  },
  "agnikul-cosmos": {
    name: "Agnikul Cosmos",
    status: "Engine testing",
    founded: "2017",
    hq: "Chennai, India",
    focus: "On-demand small-sat launches",
    description:
      "Spin-off from IIT Madras. Pioneered the world's first single-piece 3D-printed semi-cryogenic engine (Agnilet) and operates India's first private launchpad.",
    highlights: [
      "Single-piece 3D-printed Agnilet engine",
      "First private launchpad in India",
      "Configurable Agnibaan vehicle: 30-300 kg payloads",
    ],
  },
  pixxel: {
    name: "Pixxel",
    status: "Satellite ops",
    founded: "2019",
    hq: "Bengaluru / Los Angeles",
    focus: "Hyperspectral Earth observation",
    description:
      "Building the world's highest-resolution hyperspectral satellite constellation for climate, agriculture and resource monitoring.",
    highlights: [
      "Firefly constellation operational",
      "5m hyperspectral imaging across 250+ bands",
      "Backed by Google, Accenture, Lightspeed",
    ],
  },
};
