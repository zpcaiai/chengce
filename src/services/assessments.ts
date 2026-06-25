import { prisma } from "@/lib/db";
import type { AssessmentKind } from "@/generated/prisma";
import { computeAssessment } from "@/services/assessment-compute";

const EVIDENCE_TAKE = 24;

async function loadEvidence(projectId: string) {
  const ev = await prisma.evidence.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: EVIDENCE_TAKE });
  return ev.map((e) => ({ title: e.title, content: e.content }));
}

const ACTION_TAKE = 12;
/** Completed actions with a recorded outcome are fed back into every diagnosis, so
 *  the loop closes: execution results actually move the next assessment. */
async function loadActionOutcomes(projectId: string) {
  const acts = await prisma.transferAction.findMany({ where: { projectId, status: "DONE", NOT: { outcome: "" } }, orderBy: { completedAt: "desc" }, take: ACTION_TAKE });
  return acts.map((a) => ({ title: `已完成行动成效：${a.title}`, content: `${a.outcome}${typeof a.impact === "number" ? `（成效评级 ${a.impact > 0 ? "+" : ""}${a.impact}）` : ""}` }));
}

/** Run an assessment, persist it, and write an audit-log entry — all in one transaction. */
export async function runAssessment(projectId: string, kind: AssessmentKind, userId: string) {
  const project = await prisma.transformationProject.findUniqueOrThrow({ where: { id: projectId }, select: { name: true } });
  const [evidence, outcomes] = await Promise.all([loadEvidence(projectId), loadActionOutcomes(projectId)]);
  const result = await computeAssessment(project.name, kind, [...evidence, ...outcomes]);
  return prisma.$transaction(async (tx) => {
    const assessment = await tx.assessment.create({
      data: {
        projectId,
        kind,
        headlineScore: result.headlineScore,
        scores: result.scores as object,
        findings: result.findings as object,
        summary: result.summary,
        createdById: userId,
      },
    });
    await tx.auditLog.create({ data: { projectId, actorId: userId, action: `assessment.${kind.toLowerCase()}`, target: assessment.id, detail: result.summary } });
    return assessment;
  });
}

export interface AssessmentSignals {
  resilience?: number;
  founderDependency?: number;
  dependencyRisk?: number;
  leverage?: number;
  decisionQuality?: number;
  health?: number;
  collaboration?: number;
}

/** Latest value of each assessment kind, distilled into the signals the monthly report rolls up. */
export async function latestAssessmentSignals(projectId: string): Promise<AssessmentSignals> {
  const rows = await prisma.assessment.findMany({ where: { projectId }, orderBy: { createdAt: "desc" } });
  const seen = new Set<string>();
  const latest = rows.filter((r) => (seen.has(r.kind) ? false : (seen.add(r.kind), true)));
  const signals: AssessmentSignals = {};
  for (const row of latest) {
    const scores = (row.scores ?? {}) as Record<string, number>;
    if (row.kind === "STRESS_TEST") {
      signals.resilience = row.headlineScore;
      if (typeof scores.founderDependency === "number") signals.founderDependency = scores.founderDependency;
      if (typeof scores.dependencyRisk === "number") signals.dependencyRisk = scores.dependencyRisk;
    } else if (row.kind === "LEVERAGE") signals.leverage = row.headlineScore;
    else if (row.kind === "DECISION_GOVERNANCE") signals.decisionQuality = row.headlineScore;
    else if (row.kind === "ORG_HEALTH") signals.health = row.headlineScore;
    else if (row.kind === "COLLABORATION") signals.collaboration = row.headlineScore;
  }
  return signals;
}
