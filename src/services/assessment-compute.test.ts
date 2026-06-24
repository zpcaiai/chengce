import { describe, it, expect } from "vitest";
import { computeAssessment } from "@/services/assessment-compute";
import { ASSESSMENT_KINDS } from "@/domains/assessment";
import { leverageScore } from "@/lib/scoring/oikos";

const evidence = [{ title: "创始人访谈", content: "创始人亲自拍板所有大客户报价，关键架构仅两人掌握。" }];
const inRange = (x: number) => x >= 0 && x <= 1;

describe("computeAssessment over the mock AI provider", () => {
  for (const kind of ASSESSMENT_KINDS) {
    it(`${kind} returns an in-range, evidence-cited, normalized result`, async () => {
      const r = await computeAssessment("Northstar", kind, evidence);
      expect(inRange(r.headlineScore)).toBe(true);
      expect(r.findings.metrics.length).toBeGreaterThan(0);
      expect(r.findings.recommendations.length).toBeGreaterThan(0);
      expect(r.summary.length).toBeGreaterThan(0);
      for (const m of r.findings.metrics) expect(inRange(m.value)).toBe(true);
      // every cited item that carries a quote must also name its evidence source
      for (const item of r.findings.items) if (item.quote) expect(item.evidenceTitle && item.evidenceTitle.length > 0).toBe(true);
    });
  }

  it("STRESS_TEST derives founder dependency, dependency risk, and a dependency map", async () => {
    const r = await computeAssessment("Northstar", "STRESS_TEST", evidence);
    const s = r.scores as { founderDependency: number; dependencyRisk: number; resilience: number };
    expect(inRange(s.founderDependency)).toBe(true);
    expect(inRange(s.dependencyRisk)).toBe(true);
    expect(r.findings.items.some((it) => it.label.startsWith("依赖"))).toBe(true);
    // example founderIndependence = 0.25 -> founderDependency = 0.75
    expect(s.founderDependency).toBeCloseTo(0.75, 5);
  });

  it("LEVERAGE headline equals the leverage formula over its shares", async () => {
    const r = await computeAssessment("Northstar", "LEVERAGE", evidence);
    const s = r.scores as { shares: { low: number; medium: number; high: number } };
    expect(r.headlineScore).toBeCloseTo(leverageScore({ lowShare: s.shares.low, mediumShare: s.shares.medium, highShare: s.shares.high }), 5);
  });
});
