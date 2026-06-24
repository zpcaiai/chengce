import { prisma } from "@/lib/db";
import { latestAssessmentSignals } from "@/services/assessments";
import { computeSimulation, type SimulationBaseline } from "@/services/simulation-compute";

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** Assemble the current scoreboard the twin simulates against. */
export async function buildBaseline(projectId: string): Promise<SimulationBaseline> {
  const [snapshot, capabilities, signals] = await Promise.all([
    prisma.monthlySnapshot.findFirst({ where: { projectId }, orderBy: { createdAt: "desc" } }),
    prisma.criticalCapability.findMany({ where: { projectId }, orderBy: { dependencyScore: "desc" }, take: 6 }),
    latestAssessmentSignals(projectId),
  ]);
  const capabilityDependency = avg(capabilities.map((c) => c.dependencyScore));
  const metrics = [
    { label: "可复制度", value: snapshot?.replicationReadiness ?? 0 },
    { label: "创始人依赖", value: snapshot?.founderDependency ?? signals.founderDependency ?? capabilityDependency },
    { label: "抗脆弱韧性", value: snapshot?.resilience ?? signals.resilience ?? 0 },
    { label: "管理杠杆", value: signals.leverage ?? 0 },
    { label: "决策质量", value: signals.decisionQuality ?? snapshot?.decisionConsistency ?? 0 },
    { label: "知识覆盖", value: snapshot?.knowledgeCoverage ?? 0 },
  ];
  return {
    metrics,
    dependencies: capabilities.filter((c) => c.dependencyScore >= 0.6).map((c) => c.name),
    capabilities: capabilities.map((c) => c.name),
  };
}

/** Run a scenario simulation, persist it, and write an audit-log entry. */
export async function runSimulation(projectId: string, scenario: string, userId: string) {
  const project = await prisma.transformationProject.findUniqueOrThrow({ where: { id: projectId }, select: { name: true } });
  const baseline = await buildBaseline(projectId);
  const result = await computeSimulation(project.name, baseline, scenario);
  return prisma.$transaction(async (tx) => {
    const simulation = await tx.simulation.create({
      data: {
        projectId,
        scenario,
        baseline: baseline as object,
        prediction: { prediction: result.prediction, effects: result.effects, risks: result.risks, recommendations: result.recommendations } as object,
        accuracy: result.accuracy,
        createdById: userId,
      },
    });
    await tx.auditLog.create({ data: { projectId, actorId: userId, action: "simulation.run", target: simulation.id, detail: result.prediction } });
    return simulation;
  });
}
