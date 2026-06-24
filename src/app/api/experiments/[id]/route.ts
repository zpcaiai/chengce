import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { parseBody, route, HttpError } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId(); const { id } = await params;
    const experiment = await prisma.projectExperiment.findUnique({ where: { id } });
    if (!experiment) throw new HttpError(404, "Experiment not found");
    await requireProjectAccess(userId, experiment.projectId, "MEMBER");
    const body = await parseBody(req, z.object({ status: z.enum(["PLANNED", "RUNNING", "LEARNED", "PAUSED"]).optional(), result: z.string().max(3000).optional(), nextDecision: z.string().max(1000).optional(), ownerName: z.string().max(80).optional(), dueAt: z.string().datetime().nullable().optional() }));
    const updated = await prisma.projectExperiment.update({ where: { id }, data: { ...body, dueAt: body.dueAt === undefined ? undefined : body.dueAt ? new Date(body.dueAt) : null } });
    await prisma.auditLog.create({ data: { projectId: experiment.projectId, actorId: userId, action: "experiment.updated", target: id, detail: body.status ?? "result" } });
    return { experiment: updated };
  });
}
