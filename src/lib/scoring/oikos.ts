// Management-leverage scoring (Management OS lineage). Pure [0,1] functions.
import { clamp01, mean } from "./index";

/** Leverage score: weight time by tier (low=1, medium=2, high=3), normalize to [0,1]. */
export function leverageScore(i: { lowShare: number; mediumShare: number; highShare: number }): number {
  const total = clamp01(i.lowShare) + clamp01(i.mediumShare) + clamp01(i.highShare);
  if (total <= 0) return 0;
  const weighted = clamp01(i.lowShare) * 1 + clamp01(i.mediumShare) * 2 + clamp01(i.highShare) * 3;
  return clamp01(weighted / (total * 3));
}

export const decisionGovernanceScore = (i: {
  quality: number;
  consistency: number;
  speed: number;
  ownership: number;
  learning: number;
}): number => mean(Object.values(i));

export const organizationalHealthScore = (i: {
  trust: number;
  communication: number;
  execution: number;
  ownership: number;
  learning: number;
  collaboration: number;
}): number => mean(Object.values(i));

/** Resilience: 1 − average concentration/dependency (lower concentration = more anti-fragile). */
export const resilienceScore = (i: {
  founderDependency: number;
  keyPersonDependency: number;
  customerConcentration: number;
  knowledgeConcentration: number;
  productConcentration: number;
}): number => clamp01(1 - mean(Object.values(i)));

/** Dependency risk = the average concentration (the divisor of the global formula). */
export const dependencyRisk = (i: {
  founderDependency: number;
  keyPersonDependency: number;
  customerConcentration: number;
  knowledgeConcentration: number;
  productConcentration: number;
}): number => mean(Object.values(i));

export interface ManagementInputs {
  leverage: number;
  knowledge: number;
  alignment: number;
  decisionQuality: number;
  health: number;
  resilience: number;
  dependencyRisk: number;
}

/**
 * Global Management Score =
 *   (Leverage × Knowledge × Alignment × DecisionQuality × Health × Resilience),
 * penalized by DependencyRisk (modeled as (1 - risk) to stay in [0,1]).
 */
export function globalManagementScore(i: ManagementInputs): number {
  const product =
    clamp01(i.leverage) *
    clamp01(i.knowledge) *
    clamp01(i.alignment) *
    clamp01(i.decisionQuality) *
    clamp01(i.health) *
    clamp01(i.resilience);
  const independence = clamp01(1 - clamp01(i.dependencyRisk));
  return clamp01(product * (0.5 + 0.5 * independence));
}
