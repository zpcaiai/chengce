import { describe, it, expect } from "vitest";
import { clamp01, mean, geometricMean, sampleConfidence, withConfidence } from "@/lib/scoring";
import { replicationReadinessScore, organizationalHealthScore as praxisHealth, founderDependencyScore, valuesAlignmentScore, decisionConsistencyScore } from "@/lib/scoring/praxis";
import { leverageScore, decisionGovernanceScore, organizationalHealthScore, resilienceScore, dependencyRisk, globalManagementScore } from "@/lib/scoring/oikos";

const inRange = (x: number) => x >= 0 && x <= 1;

describe("scoring primitives", () => {
  it("clamp01 clamps and rejects NaN/Infinity", () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(0.5)).toBe(0.5);
    expect(clamp01(NaN)).toBe(0);
    expect(clamp01(Infinity)).toBe(0);
  });
  it("mean is 0 on empty and clamps", () => {
    expect(mean([])).toBe(0);
    expect(mean([0, 1])).toBe(0.5);
    expect(mean([2, 2])).toBe(1); // clamped
  });
  it("geometricMean collapses if any layer is zero", () => {
    expect(geometricMean([1, 1, 0])).toBeLessThan(0.05); // a single zeroed layer collapses the whole
    expect(geometricMean([0.5, 0.5])).toBeCloseTo(0.5, 5);
    expect(geometricMean([])).toBe(0);
  });
  it("confidence grows with sample size and widens the band when thin", () => {
    expect(sampleConfidence(0)).toBe(0);
    expect(sampleConfidence(6, 6)).toBeCloseTo(0.5, 5);
    const thin = withConfidence(0.8, 0);
    const thick = withConfidence(0.8, 100);
    expect(thick.high - thick.low).toBeLessThan(thin.high - thin.low);
  });
});

describe("praxis (founder replication) scoring", () => {
  it("replication readiness drops as founder dependency rises", () => {
    const base = { repeatability: 0.8, valuesAlignment: 0.8, decisionConsistency: 0.8, collaborationQuality: 0.8, leadershipMaturity: 0.8, resilience: 0.8 };
    const low = replicationReadinessScore({ ...base, founderDependency: 0.1 });
    const high = replicationReadinessScore({ ...base, founderDependency: 0.9 });
    expect(low).toBeGreaterThan(high);
    expect(inRange(low)).toBe(true);
    expect(inRange(high)).toBe(true);
  });
  it("values alignment is the inverse of dilution risk", () => {
    expect(valuesAlignmentScore([{ dilutionRisk: 0 }])).toBe(1);
    expect(valuesAlignmentScore([{ dilutionRisk: 1 }])).toBe(0);
    expect(valuesAlignmentScore([])).toBe(0);
  });
  it("founder dependency averages factor dependency", () => {
    expect(founderDependencyScore([{ founderDependencyScore: 0.4 }, { founderDependencyScore: 0.6 }])).toBeCloseTo(0.5, 5);
  });
  it("decision consistency is covered/total, guarded against zero", () => {
    expect(decisionConsistencyScore({ decisionsWithRule: 3, decisionsTotal: 6 })).toBe(0.5);
    expect(decisionConsistencyScore({ decisionsWithRule: 3, decisionsTotal: 0 })).toBe(0);
  });
  it("organizational health is penalized by founder dependency", () => {
    const i = { repeatability: 0.7, valuesAlignment: 0.7, decisionConsistency: 0.7, collaborationQuality: 0.7, leadershipMaturity: 0.7, resilience: 0.7 };
    expect(praxisHealth({ ...i, founderDependency: 0.2 })).toBeGreaterThan(praxisHealth({ ...i, founderDependency: 0.9 }));
  });
});

describe("oikos (management) scoring", () => {
  it("leverage weights time toward high-leverage work", () => {
    expect(leverageScore({ lowShare: 1, mediumShare: 0, highShare: 0 })).toBeCloseTo(1 / 3, 5);
    expect(leverageScore({ lowShare: 0, mediumShare: 0, highShare: 1 })).toBeCloseTo(1, 5);
    expect(leverageScore({ lowShare: 0, mediumShare: 0, highShare: 0 })).toBe(0);
    const mixed = leverageScore({ lowShare: 0.7, mediumShare: 0.15, highShare: 0.15 });
    expect(mixed).toBeGreaterThan(1 / 3);
    expect(mixed).toBeLessThan(0.6);
  });
  it("resilience is the inverse of average concentration", () => {
    const conc = { founderDependency: 0.8, keyPersonDependency: 0.8, customerConcentration: 0.8, knowledgeConcentration: 0.8, productConcentration: 0.8 };
    expect(resilienceScore(conc)).toBeCloseTo(0.2, 5);
    expect(dependencyRisk(conc)).toBeCloseTo(0.8, 5);
  });
  it("decision governance and org health are means of their dimensions", () => {
    expect(decisionGovernanceScore({ quality: 0.5, consistency: 0.5, speed: 0.5, ownership: 0.5, learning: 0.5 })).toBeCloseTo(0.5, 5);
    expect(organizationalHealthScore({ trust: 0.6, communication: 0.6, execution: 0.6, ownership: 0.6, learning: 0.6, collaboration: 0.6 })).toBeCloseTo(0.6, 5);
  });
  it("global management score stays in range and falls as dependency risk rises", () => {
    const base = { leverage: 0.7, knowledge: 0.7, alignment: 0.7, decisionQuality: 0.7, health: 0.7, resilience: 0.7 };
    const healthy = globalManagementScore({ ...base, dependencyRisk: 0.1 });
    const fragile = globalManagementScore({ ...base, dependencyRisk: 0.9 });
    expect(healthy).toBeGreaterThan(fragile);
    expect(inRange(healthy)).toBe(true);
    expect(inRange(fragile)).toBe(true);
  });
});
