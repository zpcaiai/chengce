import type { AssessmentKind } from "@/generated/prisma";

/** Normalized, UI-ready shape every assessment is stored and rendered as. */
export type AssessmentMetric = { label: string; value: number };
export type AssessmentItem = { label: string; detail: string; evidenceTitle?: string; quote?: string };
export type AssessmentFindings = {
  metrics: AssessmentMetric[];
  items: AssessmentItem[];
  recommendations: string[];
};

export const ASSESSMENT_META: Record<AssessmentKind, { label: string; blurb: string; higherIsHealthy: boolean }> = {
  STRESS_TEST: { label: "关键人依赖压力测试", blurb: "创始人/关键人一旦离开，组织会从哪里先断裂", higherIsHealthy: true },
  LEVERAGE: { label: "管理杠杆", blurb: "管理时间落在低/中/高杠杆活动的分布", higherIsHealthy: true },
  ORG_HEALTH: { label: "组织健康", blurb: "信任、沟通、执行、归属、学习、协作的健康度", higherIsHealthy: true },
  DECISION_GOVERNANCE: { label: "决策治理", blurb: "决策的质量、一致性、速度、归属与学习", higherIsHealthy: true },
  COLLABORATION: { label: "协作分析", blurb: "团队协作质量与摩擦点", higherIsHealthy: true },
};

export const ASSESSMENT_KINDS: AssessmentKind[] = [
  "STRESS_TEST",
  "LEVERAGE",
  "DECISION_GOVERNANCE",
  "ORG_HEALTH",
  "COLLABORATION",
];
