import { describe, it, expect } from "vitest";
import { deckFromSnapshot, type SnapshotLike } from "@/lib/deck/from-snapshot";

const snap: SnapshotLike = {
  founderDependency: 0.4, knowledgeCoverage: 0.6, decisionConsistency: 0.5,
  playbookAdoption: 0.3, openRiskCount: 2, replicationReadiness: 0.7,
  resilience: 0.65, globalManagement: 0.55, summary: "测试摘要", priorities: ["关闭A", "批准B"],
  createdAt: new Date("2026-06-01"),
};

describe("deckFromSnapshot", () => {
  it("builds cover + two metric slides + closing", () => {
    const deck = deckFromSnapshot(snap, "测试项目");
    expect(deck.slides[0].layout).toBe("cover");
    expect(deck.slides.at(-1)?.layout).toBe("closing");
    const metrics = deck.slides.filter((s) => s.layout === "metrics");
    expect(metrics.length).toBe(2);
    expect(metrics[0].metrics?.find((m) => m.label === "可复制度")?.value).toBe("70%");
    expect(deck.themeId).toBe("ink");
  });

  it("includes priorities as a bullets slide", () => {
    const deck = deckFromSnapshot(snap, "测试项目");
    expect(deck.slides.find((s) => s.layout === "bullets")?.bullets).toContain("关闭A");
  });

  it("omits the bullets slide when there are no priorities", () => {
    const deck = deckFromSnapshot({ ...snap, priorities: [] }, "P");
    expect(deck.slides.some((s) => s.layout === "bullets")).toBe(false);
  });
});
