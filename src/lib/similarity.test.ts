import { describe, it, expect } from "vitest";
import { cosine, keywordScore } from "@/lib/similarity";

describe("similarity ranking", () => {
  it("cosine: identical=1, orthogonal=0, mismatched/empty=0", () => {
    expect(cosine([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 5);
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0, 5);
    expect(cosine([1, 2], [1, 2, 3])).toBe(0);
    expect(cosine([], [])).toBe(0);
  });
  it("keywordScore: full contain=1, term overlap, CJK char fallback", () => {
    expect(keywordScore("定价", "关于定价的判断")).toBe(1);
    expect(keywordScore("foo bar", "this has foo only")).toBeCloseTo(0.5, 5);
    expect(keywordScore("", "anything")).toBe(0);
    const partial = keywordScore("定价策略", "只谈定价");
    expect(partial).toBeGreaterThan(0);
    expect(partial).toBeLessThan(1);
  });
});
