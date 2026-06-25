import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { parseBody, route, HttpError } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId(); const { id } = await params; const action = await prisma.transferAction.findUnique({ where: { id } });
    if (!action) throw new HttpError(404, "Action not found");
    await requireProjectAccess(userId, action.projectId, "MEMBER");
    const body = await parseBody(req, z.object({ title: z.string().min(3).max(160).optional(), description: z.string().max(1000).optional(), ownerName: z.string().max(80).optional(), dueAt: z.string().datetime().nullable().optional(), status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]).optional(), proof: z.string().max(3000).optional(), outcome: z.string().max(2000).optional(), impact: z.number().int().min(-2).max(2).nullable().optional() }));
    const completedAt = body.status === "DONE" ? (action.completedAt ?? new Date()) : body.status ? null : undefined;
    const updated = await prisma.transferAction.update({ where: { id }, data: { ...body, dueAt: body.dueAt === undefined ? undefined : body.dueAt ? new Date(body.dueAt) : null, completedAt } });
    await prisma.auditLog.create({ data: { projectId: action.projectId, actorId: userId, action: "action.updated", target: id, detail: body.status ?? "proof" } });
    return { action: updated };
  });
}
