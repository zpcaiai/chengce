import { prisma } from "@/lib/db";
import { clamp01 } from "@/lib/scoring";
import { replicationReadinessScore } from "@/lib/scoring/praxis";
import { globalManagementScore } from "@/lib/scoring/oikos";
import { latestAssessmentSignals } from "@/services/assessments";

const average = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);

export async function createMonthlySnapshot(projectId: string) {
  const [capabilities, assets, actions, feedback, signals] = await Promise.all([
    prisma.criticalCapability.findMany({ where: { projectId } }),
    prisma.systemAsset.findMany({ where: { projectId } }),
    prisma.transferAction.findMany({ where: { projectId } }),
    prisma.playbookFeedback.findMany({ where: { asset: { projectId } } }),
    latestAssessmentSignals(projectId),
  ]);

  // Founder dependency now prefers the key-person stress test; falls back to the
  // capability-weighted average when no stress test has been run yet.
  const capabilityDependency = average(capabilities.map((c) => c.dependencyScore));
  const founderDependency = clamp01(signals.founderDependency ?? capabilityDependency);
  const resilience = clamp01(signals.resilience ?? 1 - founderDependency);

  const knowledgeCoverage = capabilities.length ? clamp01(assets.filter((a) => a.status === "APPROVED").length / capabilities.length) : 0;
  const usedAssets = new Set(feedback.filter((item) => item.kind === "USED").map((item) => item.assetId));
  const approvedAssets = assets.filter((asset) => asset.status === "APPROVED");
  const playbookAdoption = approvedAssets.length ? clamp01(usedAssets.size / approvedAssets.length) : 0;
  const decisionConsistency = assets.length ? clamp01(assets.filter((a) => a.kind === "DECISION_RULE" && a.status === "APPROVED").length / Math.max(1, capabilities.length)) : 0;
  const openRiskCount = capabilities.filter((c) => c.dependencyScore >= 0.7 && c.status !== "TRANSFERRED").length;

  const repeatability = average(capabilities.map((c) => c.repeatabilityScore));
  const replicationReadiness = replicationReadinessScore({
    repeatability,
    valuesAlignment: signals.health ?? 0.6,
    decisionConsistency,
    collaborationQuality: signals.collaboration ?? 0.6,
    leadershipMaturity: signals.health ?? 0.6,
    resilience,
    founderDependency,
    scalabilityFallback: repeatability,
  });
  const globalManagement = globalManagementScore({
    leverage: signals.leverage ?? 0.5,
    knowledge: knowledgeCoverage,
    alignment: signals.health ?? 0.6,
    decisionQuality: signals.decisionQuality ?? decisionConsistency,
    health: signals.health ?? knowledgeCoverage,
    resilience,
    dependencyRisk: signals.dependencyRisk ?? founderDependency,
  });

  const priorities = [
    ...capabilities.filter((c) => c.dependencyScore >= 0.7 && c.status !== "TRANSFERRED").slice(0, 2).map((c) => `把“${c.name}”从创始人依赖中转移出去。`),
    ...assets.filter((a) => a.status === "DRAFT").slice(0, 1).map((a) => `复审并批准“${a.title}”。`),
    ...actions.filter((a) => a.status === "BLOCKED").slice(0, 1).map((a) => `解除“${a.title}”的阻塞。`),
  ].slice(0, 3);
  const summary = `创始人依赖 ${(founderDependency * 100).toFixed(0)}%，可复制度 ${(replicationReadiness * 100).toFixed(0)}%；已批准运营资产 ${approvedAssets.length} 项，仍有 ${openRiskCount} 项高风险能力未关闭。`;

  return prisma.monthlySnapshot.create({
    data: {
      projectId, founderDependency, knowledgeCoverage, decisionConsistency, playbookAdoption,
      openRiskCount, replicationReadiness, resilience, globalManagement, summary, priorities,
    },
  });
}
