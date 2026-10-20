import { describe, expect, it } from "vitest";
import { formatCount, getCountState, getReadinessSummary, type ReadinessCheck } from "@/lib/readiness";

describe("readiness helpers", () => {
  it("classifies required and optional counts", () => {
    expect(getCountState(12)).toBe("ready");
    expect(getCountState(0)).toBe("warning");
    expect(getCountState(null)).toBe("blocked");
    expect(getCountState(0, false)).toBe("ready");
    expect(getCountState(null, false)).toBe("warning");
  });

  it("summarizes readiness checks by worst state", () => {
    const checks: ReadinessCheck[] = [
      { id: "a", label: "A", state: "ready", detail: "ok" },
      { id: "b", label: "B", state: "warning", detail: "warn" },
      { id: "c", label: "C", state: "blocked", detail: "blocked" },
    ];

    expect(getReadinessSummary(checks)).toEqual({
      state: "blocked",
      ready: 1,
      warnings: 1,
      blocked: 1,
      total: 3,
    });
  });

  it("formats unavailable counts clearly", () => {
    expect(formatCount(null)).toBe("Unavailable");
    expect(formatCount(1200)).toBe("1,200");
  });
});
