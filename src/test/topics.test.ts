import { describe, expect, it } from "vitest";
import { findTopicBySlug, FALLBACK_TOPICS } from "@/lib/topics";

describe("findTopicBySlug", () => {
  it("returns the matching topic from the catalog", () => {
    expect(findTopicBySlug(FALLBACK_TOPICS, "mars")?.title).toBe("Mars");
  });

  it("returns null for a missing topic", () => {
    expect(findTopicBySlug(FALLBACK_TOPICS, "unknown")).toBeNull();
  });
});
