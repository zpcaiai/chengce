import { describe, it, expect } from "vitest";
import { computeDeck } from "@/services/deck-compute";

describe("computeDeck (mock provider)", () => {
  it("returns a titled deck with a cover and the requested theme", async () => {
    const d = await computeDeck({ topic: "用 AI 重塑客户支持", scenario: "产品发布", themeId: "aurora" });
    expect(d.title.length).toBeGreaterThan(0);
    expect(d.themeId).toBe("aurora");
    expect(d.slides.length).toBeGreaterThanOrEqual(3);
    expect(d.slides[0].layout).toBe("cover");
  });
});
