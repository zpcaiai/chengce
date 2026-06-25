// Pure assessment computation: run the right diagnostic agent over evidence and
// normalize its output into a headline score + UI-ready findings. No prisma here,
// so this whole path is unit-testable against the mock AI provider.
import type { AssessmentKind } from "@/generated/prisma";
import { mean, sampleConfidence } from "@/lib/scoring";
import { leverageScore } from "@/lib/scoring/oikos";
import type { AssessmentFindings, AssessmentItem } from "@/domains/assessment";
import {
  KeyPersonStressTest,
  OrgLeverageAnalyst,
  DecisionGovernanceAnalyst,
  OrgHealthAnalyst,
  CollaborationAnalyst,
} from "@/agents/diagnostics";

const TIER_LABEL: Record<string, string> = { LOW: "低杠杆", MEDIUM: "中杠杆", HIGH: "高杠杆" };

type ScoredDimension = { key: string; label: string; score: number; finding: string; evidenceTitle: string; quote: string };

export interface AssessmentResult {
  headlineScore: number;
  scores: unknown;
  findings: AssessmentFindings;
  summary: string;
}

function fromDimensions(dimensions: ScoredDimension[], recommendations: string[], extraItems: AssessmentItem[] = []): Omit<AssessmentResult, "summary"> {
  return {
    headlineScore: mean(dimensions.map((d) => d.score)),
    scores: { dimensions },
    findings: {
      metrics: dimensions.map((d) => ({ label: d.label, value: d.score })),
      items: [
        ...dimensions.map((d) => ({ label: d.label, detail: d.finding, evidenceTitle: d.evidenceTitle, quote: d.quote })),
        ...extraItems,
      ],
      recommendations,
    },
  };
}

/** Run the agent for a kind over the project's evidence and normalize the result. */
async function computeAssessmentRaw(company: string, kind: AssessmentKind, evidence: { title: string; content: string }[]): Promise<AssessmentResult> {
  if (kind === "STRESS_TEST") {
    const out = await KeyPersonStressTest.run({ company, evidence });
    const dependencyItems: AssessmentItem[] = out.dependencyMap.map((d) => ({
      label: `依赖：${d.area}`,
      detail: `依赖集中度 ${Math.round(d.dependency * 100)}%`,
      evidenceTitle: d.evidenceTitle,
      quote: d.quote,
    }));
    const base = fromDimensions(out.dimensions, out.recommendations, dependencyItems);
    const founderIndependence = out.dimensions.find((d) => d.key === "founderIndependence")?.score;
    const founderDependency = founderIndependence != null ? 1 - founderIndependence : 1 - base.headlineScore;
    const dependencyRisk = out.dependencyMap.length ? mean(out.dependencyMap.map((d) => d.dependency)) : 1 - base.headlineScore;
    return {
      ...base,
      scores: { dimensions: out.dimensions, dependencyMap: out.dependencyMap, founderDependency, resilience: base.headlineScore, dependencyRisk, scenario: out.scenario },
      summary: `${out.summary} 最先断裂：${out.scenario}`,
    };
  }
  if (kind === "LEVERAGE") {
    const out = await OrgLeverageAnalyst.run({ company, evidence });
    const headlineScore = leverageScore({ lowShare: out.shares.low, mediumShare: out.shares.medium, highShare: out.shares.high });
    return {
      headlineScore,
      scores: { shares: out.shares, classified: out.classified },
      findings: {
        metrics: [
          { label: "低杠杆占比", value: out.shares.low },
          { label: "中杠杆占比", value: out.shares.medium },
          { label: "高杠杆占比", value: out.shares.high },
          { label: "杠杆得分", value: headlineScore },
        ],
        items: out.classified.map((c) => ({ label: c.activity, detail: TIER_LABEL[c.tier] ?? c.tier, evidenceTitle: c.evidenceTitle, quote: c.quote })),
        recommendations: out.recommendations,
      },
      summary: out.summary,
    };
  }
  const agent = kind === "DECISION_GOVERNANCE" ? DecisionGovernanceAnalyst : kind === "ORG_HEALTH" ? OrgHealthAnalyst : CollaborationAnalyst;
  const out = await agent.run({ company, evidence });
  return { ...fromDimensions(out.dimensions, out.recommendations), summary: out.summary };
}

/** Public entry: run the assessment, then attach an honest confidence band from the
 *  evidence sample size so the UI never shows false precision. */
export async function computeAssessment(company: string, kind: AssessmentKind, evidence: { title: string; content: string }[]): Promise<AssessmentResult> {
  const result = await computeAssessmentRaw(company, kind, evidence);
  const samples = evidence.length;
  return { ...result, findings: { ...result.findings, confidence: sampleConfidence(samples), samples } };
}
