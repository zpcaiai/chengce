import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { created, route, HttpError } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";
import { FounderSystemsAnalyst } from "@/agents/founder-systems";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId(); const { id: projectId } = await params;
    const { project } = await requireProjectAccess(userId, projectId, "ADVISOR");
    const evidence = await prisma.evidence.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 20 });
    if (!evidence.length) throw new HttpError(400, "Add at least one interview, document, or note before running a diagnosis");
    const analysis = await FounderSystemsAnalyst.run({ company: project.name, evidence: evidence.map((e) => ({ title: e.title, content: e.content })) });
    const result = await prisma.$transaction(async (tx) => {
      const evidenceByTitle = new Map(evidence.map((item) => [item.title, item]));
      const capabilities = await Promise.all(analysis.capabilities.map(async (c) => {
        const capability = await tx.criticalCapability.create({ data: { projectId, name: c.name, description: c.description, dependencyScore: c.dependencyScore, repeatabilityScore: c.repeatabilityScore, riskIfLost: c.riskIfLost, ownerName: c.ownerName } });
        const source = evidenceByTitle.get(c.evidenceTitle);
        if (source) await tx.evidenceReference.create({ data: { evidenceId: source.id, capabilityId: capability.id, quote: c.quote, reason: "Evidence supporting the capability diagnosis." } });
        return { capability, citation: { evidenceTitle: c.evidenceTitle, quote: c.quote } };
      }));
      const actions = await Promise.all(analysis.actions.map((a) => tx.transferAction.create({ data: { projectId, title: a.title, description: a.description, ownerName: a.ownerName } })));
      await tx.auditLog.create({ data: { projectId, actorId: userId, action: "diagnosis.run", target: projectId, detail: analysis.summary } });
      return { capabilities, actions };
    });
    return created({ analysis, ...result });
  });
}
