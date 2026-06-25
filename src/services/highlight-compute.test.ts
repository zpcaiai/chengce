import { describe, it, expect } from "vitest";
import { computeHighlights } from "@/services/highlight-compute";

describe("computeHighlights (mock provider)", () => {
  it("returns non-empty highlights with quote / why / suggestion", async () => {
    const hs = await computeHighlights("创始人访谈", "超过两周的定制开发，必须先验证年度合同额。");
    expect(hs.length).toBeGreaterThan(0);
    for (const h of hs) {
      expect(h.quote.length).toBeGreaterThan(0);
      expect(h.why.length).toBeGreaterThan(0);
      expect(typeof h.suggestion).toBe("string");
    }
  });
});
