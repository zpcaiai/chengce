// Founder-replication scoring (SFM lineage). Pure [0,1] functions. The headline
// is replicationReadiness: how ready the company is to run without the founder.
import { clamp01, mean, geometricMean } from "./index";

/** Founder Dependency: how much success still routes through the founder (higher = more dependent = a drag). */
export const founderDependencyScore = (factors: { founderDependencyScore: number }[]): number =>
  mean(factors.map((f) => f.founderDependencyScore));

/** Success-factor Repeatability across modeled factors. */
export const repeatabilityScore = (factors: { repeatabilityScore: number }[]): number =>
  mean(factors.map((f) => f.repeatabilityScore));

/** Business Scalability across modeled factors. */
export const scalabilityScore = (factors: { scalabilityScore: number }[]): number =>
  mean(factors.map((f) => f.scalabilityScore));

/** Values Alignment: 1 − average dilution risk across core values. */
export const valuesAlignmentScore = (values: { dilutionRisk: number }[]): number =>
  values.length ? clamp01(1 - mean(values.map((v) => v.dilutionRisk))) : 0;

/** Decision Consistency: share of decision areas covered by an explicit rule. */
export const decisionConsistencyScore = (i: { decisionsWithRule: number; decisionsTotal: number }): number =>
  i.decisionsTotal <= 0 ? 0 : clamp01(i.decisionsWithRule / i.decisionsTotal);

export const collaborationQualityScore = (patterns: { score: number }[]): number =>
  mean(patterns.map((p) => p.score));

export const leadershipMaturityScore = (patterns: { maturityScore: number }[]): number =>
  mean(patterns.map((p) => p.maturityScore));

/** Resilience from stress-test dimensions (higher score = more anti-fragile). */
export const resilienceScore = (patterns: { score: number }[]): number =>
  mean(patterns.map((p) => p.score));

export interface ReplicationInputs {
  repeatability: number;
  valuesAlignment: number;
  decisionConsistency: number;
  collaborationQuality: number;
  leadershipMaturity: number;
  resilience: number;
  /** 0..1, higher = more founder-dependent (a drag). */
  founderDependency: number;
  scalabilityFallback?: number;
}

/**
 * Replication Readiness =
 *   Repeatability × ValuesAlignment × DecisionConsistency × CollaborationQuality
 *   × LeadershipMaturity × Resilience, penalized by FounderDependency.
 * Founder dependency penalizes but never zeroes the result, so the metric stays
 * actionable across the whole transfer journey.
 */
export function replicationReadinessScore(i: ReplicationInputs): number {
  const product =
    clamp01(i.repeatability) *
    clamp01(i.valuesAlignment) *
    clamp01(i.decisionConsistency) *
    clamp01(i.collaborationQuality) *
    clamp01(i.leadershipMaturity) *
    clamp01(i.resilience);
  const independence = clamp01(1 - clamp01(i.founderDependency));
  return clamp01(product * (0.5 + 0.5 * independence));
}

/** Organizational Health: geometric mean of the healthy signals (one weak layer drags the whole). */
export function organizationalHealthScore(i: ReplicationInputs): number {
  return geometricMean([
    i.repeatability,
    i.scalabilityFallback ?? i.repeatability,
    i.valuesAlignment,
    i.decisionConsistency,
    i.collaborationQuality,
    i.leadershipMaturity,
    i.resilience,
    1 - i.founderDependency,
  ]);
}
