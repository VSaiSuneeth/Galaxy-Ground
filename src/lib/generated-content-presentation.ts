type GeneratedPostInput = {
  title?: string | null;
  content?: string | null;
  summary?: string | null;
  hashtags?: string[] | null;
  category?: string | null;
  authorName?: string | null;
  kind?: "startup" | "themed";
};

const MIN_RICH_CHARS = 500;
const PLACEHOLDER_PATTERNS = [
  /this is a long regenerated content/i,
  /ensure it meets the quality requirement/i,
  /being at least 500 characters long/i,
];

const FALLBACK_TAGS_BY_CATEGORY: Record<string, string[]> = {
  astrophotography: ["astrophotography", "nightsky", "stargazing", "space", "astronomy"],
  "rocket engineering": ["rocket", "propulsion", "launch", "aerospace", "space"],
  "launch vehicles": ["rocket", "launch", "aerospace", "spaceindustry", "space"],
  "satellite manufacturers": ["satellite", "spaceindustry", "earthobservation", "aerospace", "space"],
  "space data & analytics": ["spacedata", "earthobservation", "geospatial", "satellite", "space"],
  "indian space program": ["isro", "india", "space", "satellite", "gaganyaan"],
  "space policy and law": ["spacepolicy", "spacelaw", "regulation", "space", "policy"],
  astrobiology: ["astrobiology", "exoplanets", "science", "space", "life"],
};

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function normalizeForCompare(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function uniqueTags(input: GeneratedPostInput): string[] {
  const tags = new Set<string>();
  for (const raw of input.hashtags || []) {
    const tag = cleanText(raw).replace(/^#+/, "").toLowerCase();
    if (/^[a-z0-9_]{2,40}$/.test(tag)) tags.add(tag);
  }

  const categoryKey = cleanText(input.category).toLowerCase();
  for (const tag of FALLBACK_TAGS_BY_CATEGORY[categoryKey] || []) tags.add(tag);
  if (input.kind === "startup") tags.add("startup");
  if (input.kind === "themed") tags.add("space");

  return Array.from(tags).slice(0, 6);
}

function stripRepeatedTitle(title: string, body: string): string {
  const normalizedTitle = normalizeForCompare(title);
  const normalizedBody = normalizeForCompare(body);
  if (!normalizedTitle || !normalizedBody) return body;
  if (normalizedBody === normalizedTitle) return "";
  if (!normalizedBody.startsWith(normalizedTitle)) return body;
  return body.slice(Math.min(body.length, title.length)).replace(/^\s*[:\-.]?\s*/, "").trim();
}

function isThinGeneratedText(title: string, body: string): boolean {
  if (PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(body))) return true;
  const stripped = stripRepeatedTitle(title, body);
  if (stripped.length < MIN_RICH_CHARS) return true;
  const normalizedTitle = normalizeForCompare(title);
  const normalizedBody = normalizeForCompare(stripped);
  return !!normalizedTitle && normalizedBody === normalizedTitle;
}

function buildFallbackBody(input: GeneratedPostInput, title: string, tags: string[]): string {
  const category = cleanText(input.category) || (input.kind === "startup" ? "space industry" : "space exploration");
  const author = cleanText(input.authorName) || (input.kind === "startup" ? "this startup" : "this space account");
  const focus = tags.slice(0, 3).join(", ") || category.toLowerCase();

  if (input.kind === "startup") {
    return [
      `${author}'s latest update, "${title}", is worth watching because it points to a broader shift inside ${category}. The story is not only about one announcement; it touches the practical work of turning engineering progress, funding momentum, partnerships, and customer demand into reliable operations.`,
      `The important questions now are how this milestone changes execution timelines, what it means for payload customers or downstream users, and whether the company can convert the attention into repeatable delivery. For investors, suppliers, regulators, and potential partners, the signal is strongest when it is backed by measurable progress, transparent milestones, and clear technical follow-through.`,
      `Galaxy Ground will keep tracking official updates, source confirmation, media evidence, and the next operational step. The outcome can influence confidence across ${focus}, especially if the team shows consistency beyond the headline.`,
    ].join("\n\n");
  }

  return [
    `${title}. For followers of ${category.toLowerCase()}, this is more than a passing headline. It gives the community a useful moment to look closer at the science, imagery, instrumentation, and context behind the result.`,
    `The strongest space stories become meaningful when they connect observation with explanation. Details such as the object being studied, the telescope or mission involved, the processing method, and the follow-up evidence all help separate a beautiful image from a durable scientific update.`,
    `We will keep watching for official releases, better-resolution media, confirmed measurements, and the next milestone that adds substance to the story. For now, it is a useful reminder of why ${focus} continues to pull both experts and curious observers into the same conversation.`,
  ].join("\n\n");
}

export function buildGeneratedPostDisplay(input: GeneratedPostInput): { content: string; hashtags: string[] } {
  const title = cleanText(input.title);
  const rawBody = cleanText(input.summary) || cleanText(input.content);
  const tags = uniqueTags(input);
  const body = stripRepeatedTitle(title, rawBody);
  const finalBody = isThinGeneratedText(title, rawBody) ? buildFallbackBody(input, title || rawBody || "Space update", tags) : body;
  const heading = title && !normalizeForCompare(finalBody).startsWith(normalizeForCompare(title)) ? `${title}\n\n` : "";
  const tagLine = tags.length ? `\n\n${tags.map((tag) => `#${tag}`).join(" ")}` : "";
  return {
    content: `${heading}${finalBody}${tagLine}`.trim(),
    hashtags: tags,
  };
}
