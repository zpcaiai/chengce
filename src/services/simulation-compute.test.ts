import { describe, it, expect } from "vitest";
import { computeSimulation } from "@/services/simulation-compute";

const inRange = (x: number) => x >= 0 && x <= 1;
const baseline = {
  metrics: [
    { label: "可复制度", value: 0.42 },
    { label: "创始人依赖", value: 0.8 },
    { label: "抗脆弱韧性", value: 0.45 },
  ],
  dependencies: ["大客户定价决策"],
  capabilities: ["高触达客户成功"],
};

describe("computeSimulation (mock provider)", () => {
  it("returns in-range effects, risks, moves, and an honest accuracy caveat", async () => {
    const r = await computeSimulation("Northstar", baseline, "创始人在 6 个月内退出日常运营");
    expect(r.effects.length).toBeGreaterThan(0);
    expect(r.risks.length).toBeGreaterThan(0);
    expect(r.recommendations.length).toBeGreaterThan(0);
    expect(r.prediction.length).toBeGreaterThan(0);
    expect(inRange(r.accuracy)).toBe(true);
    for (const e of r.effects) {
      expect(["UP", "DOWN", "FLAT"]).toContain(e.direction);
      expect(inRange(e.magnitude)).toBe(true);
    }
  });
});
