import { prisma } from "@/lib/db";
import type { Reversibility } from "@/generated/prisma";
import { computeRetrospective, type DecisionInput } from "@/services/decision-compute";

export interface NewDecision {
  title: string;
  context: string;
  decision: string;
  rationale: string;
  ownerName: string;
  reversibility: Reversibility;
  expectedOutcome: string;
}

export async function createDecision(projectId: string, data: NewDecision, userId: string) {
  const decision = await prisma.decision.create({ data: { projectId, ...data, decidedAt: new Date(), createdById: userId } });
  await prisma.auditLog.create({ data: { projectId, actorId: userId, action: "decision.create", target: decision.id, detail: decision.title } });
  return decision;
}

/** Run a retrospective on a decision, store the review, close the decision, and audit it. */
export async function runRetrospective(decisionId: string, outcome: string, reviewerName: string, userId: string) {
  const decision = await prisma.decision.findUniqueOrThrow({ where: { id: decisionId }, include: { project: { select: { id: true, name: true } } } });
  const input: DecisionInput = {
    title: decision.title,
    context: decision.context,
    decision: decision.decision,
    rationale: decision.rationale,
    reversibility: decision.reversibility,
    expectedOutcome: decision.expectedOutcome,
  };
  const result = await computeRetrospective(decision.project.name, input, outcome);
  return prisma.$transaction(async (tx) => {
    const review = await tx.decisionReview.create({
      data: { decisionId, outcome, analysis: result as object, governanceScore: result.governanceScore, reviewerName, createdById: userId },
    });
    await tx.decision.update({ where: { id: decisionId }, data: { status: "CLOSED" } });
    await tx.auditLog.create({ data: { projectId: decision.project.id, actorId: userId, action: "decision.review", target: decisionId, detail: result.summary } });
    return review;
  });
}
