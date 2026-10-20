import { describe, expect, it } from "vitest";
import { shouldPromptOnboarding } from "@/lib/onboarding";

describe("shouldPromptOnboarding", () => {
  it("prompts when the profile has no interests, user is new, and session is not completed", () => {
    const recentTime = new Date(Date.now() - 10000).toISOString(); // 10 seconds ago
    expect(shouldPromptOnboarding({ interests: [] }, recentTime, false)).toBe(true);
  });

  it("does not prompt when the profile already has interests, user is not new, or session is complete", () => {
    const recentTime = new Date(Date.now() - 10000).toISOString();
    const oldTime = new Date(Date.now() - 120000).toISOString(); // 2 minutes ago

    // Already has interests
    expect(shouldPromptOnboarding({ interests: ["Space"] }, recentTime, false)).toBe(false);

    // Old user
    expect(shouldPromptOnboarding({ interests: [] }, oldTime, false)).toBe(false);

    // Session completed
    expect(shouldPromptOnboarding({ interests: [] }, recentTime, true)).toBe(false);
  });
});

