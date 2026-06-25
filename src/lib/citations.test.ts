import { describe, it, expect } from "vitest";
import { quoteFound } from "@/lib/citations";

describe("citation integrity check", () => {
  it("matches normalized substrings and flags fabricated quotes", () => {
    expect(quoteFound("亲自审核每一份提案", "我会 亲自审核每一份提案。")).toBe(true);
    expect(quoteFound("“亲自审核”", "我会亲自审核每一份提案")).toBe(true);
    expect(quoteFound("从未说过的话", "我会亲自审核每一份提案")).toBe(false);
    expect(quoteFound("", "anything")).toBe(true);
  });
});
