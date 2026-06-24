import { describe, it, expect } from "vitest";
import { computeRetrospective } from "@/services/decision-compute";

const inRange = (x: number) => x >= 0 && x <= 1;
const decision = {
  title: "接下一个大客户的定制需求",
  context: "对方预算高但要求大量定制",
  decision: "接了，并承诺 3 个月交付",
  rationale: "看重 logo 与现金流",
  reversibility: "LOW" as const,
  expectedOutcome: "树立标杆客户",
};

describe("computeRetrospective (mock provider)", () => {
  it("separates decision quality from outcome and returns in-range scores", async () => {
    const r = await computeRetrospective("Northstar", decision, "定制拖累了路线图两个季度，毛利低于预期");
    expect(inRange(r.soundness)).toBe(true);
    expect(inRange(r.governanceScore)).toBe(true);
    expect(r.lessons.length).toBeGreaterThan(0);
    expect(r.summary.length).toBeGreaterThan(0);
    expect(typeof r.suggestedRule).toBe("string");
    expect(Array.isArray(r.followUps)).toBe(true);
  });
});
