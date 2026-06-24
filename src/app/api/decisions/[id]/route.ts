import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { route, parseBody, HttpError } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";

const body = z.object({ status: z.enum(["OPEN", "REVIEWING", "CLOSED"]) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    const decision = await prisma.decision.findUnique({ where: { id }, select: { projectId: true } });
    if (!decision) throw new HttpError(404, "Decision not found");
    await requireProjectAccess(userId, decision.projectId, "ADVISOR");
    const { status } = await parseBody(req, body);
    const updated = await prisma.decision.update({ where: { id }, data: { status } });
    await prisma.auditLog.create({ data: { projectId: decision.projectId, actorId: userId, action: "decision.status", target: id, detail: status } });
    return { decision: updated };
  });
}
