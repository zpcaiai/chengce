import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { created, parseBody, route, HttpError } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";
import { SystemAssetAuthor } from "@/agents/founder-systems";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId(); const { id: projectId } = await params;
    await requireProjectAccess(userId, projectId, "ADVISOR");
    const body = await parseBody(req, z.object({ kind: z.enum(["DECISION_RULE", "OPERATING_PRINCIPLE", "PLAYBOOK"]), title: z.string().min(3).max(160), capability: z.string().min(2), evidenceIds: z.array(z.string().cuid()).min(1), reviewAt: z.string().datetime().optional() }));
    const evidence = await prisma.evidence.findMany({ where: { id: { in: body.evidenceIds }, projectId } });
    if (evidence.length !== body.evidenceIds.length) throw new HttpError(400, "Every cited source must belong to this project");
    const draft = await SystemAssetAuthor.run({ kind: body.kind, title: body.title, capability: body.capability, evidence: evidence.map((e) => ({ title: e.title, content: e.content })) });
    const asset = await prisma.systemAsset.create({ data: { projectId, kind: body.kind, title: body.title, ownerName: draft.owner, content: { purpose: draft.purpose, whenToUse: draft.whenToUse, owner: draft.owner, trigger: draft.trigger, steps: draft.steps, doneWhen: draft.doneWhen, exceptions: draft.exceptions, examples: draft.examples }, reviewAt: body.reviewAt ? new Date(body.reviewAt) : null } });
    const byTitle = new Map(evidence.map((e) => [e.title, e]));
    await prisma.evidenceReference.createMany({ data: draft.citations.flatMap((c) => { const source = byTitle.get(c.evidenceTitle); return source ? [{ assetId: asset.id, evidenceId: source.id, quote: c.quote, reason: c.reason }] : []; }) });
    await prisma.auditLog.create({ data: { projectId, actorId: userId, action: "asset.drafted", target: asset.id, detail: asset.title } });
    return created({ asset, draft });
  });
}
