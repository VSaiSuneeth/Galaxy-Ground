import { describe, expect, it } from "vitest";
import {
  getLearningPathBySlug,
  getLearningProgressPercent,
  parseLearningProgress,
  serializeLearningProgress,
  toggleLearningProgressItem,
} from "@/lib/learning";

describe("learning helpers", () => {
  it("returns the matching path from the catalog", () => {
    const result = getLearningPathBySlug("orbital-mechanics-101");

    expect(result?.title).toBe("Orbital Mechanics 101");
  });

  it("tracks progress as a percentage of completed items", () => {
    const updated = toggleLearningProgressItem({}, "orbital-mechanics-101", "Orbit shapes");
    const percent = getLearningProgressPercent(
      ["Orbit shapes", "Hohmann transfers", "Plane changes", "Mission examples"],
      updated["orbital-mechanics-101"] ?? [],
    );

    expect(percent).toBe(25);
  });

  it("ignores duplicate completed items when calculating progress", () => {
    const percent = getLearningProgressPercent(["A", "B"], ["A", "A", "missing"]);

    expect(percent).toBe(50);
  });

  it("safely parses persisted progress", () => {
    const saved = serializeLearningProgress({ "satellite-systems": ["Mission requirements"] });

    expect(parseLearningProgress(saved)).toEqual({ "satellite-systems": ["Mission requirements"] });
    expect(parseLearningProgress("{bad json")).toEqual({});
    expect(parseLearningProgress(JSON.stringify({ path: [1, "valid", null] }))).toEqual({ path: ["valid"] });
  });
});
