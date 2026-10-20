import { describe, expect, it } from "vitest";
import { normalizeFeedPost } from "@/lib/safe-data";

describe("normalizeFeedPost", () => {
  it("preserves interaction flags from feed payloads", () => {
    const result = normalizeFeedPost({
      id: "post-123",
      user_id: "user-1",
      content: "hello",
      created_at: "2024-01-01T00:00:00.000Z",
      user_has_liked: true,
      user_has_bookmarked: true,
      reaction_type: "rocket",
      likes_count: "5",
      comments_count: "2",
    } as any);

    expect(result.user_has_liked).toBe(true);
    expect(result.user_has_bookmarked).toBe(true);
    expect(result.reaction_type).toBe("rocket");
    expect(result.likes_count).toBe(5);
    expect(result.comments_count).toBe(2);
  });
});
