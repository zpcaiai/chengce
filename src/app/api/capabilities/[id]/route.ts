import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { route, parseBody, HttpError } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";

const body = z.object({
  status: z.enum(["CANDIDATE", "CONFIRMED", "TRANSFERRING", "TRANSFERRED"]).optional(),
  ownerName: z.string().max(120).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    const capability = await prisma.criticalCapability.findUnique({ where: { id }, select: { projectId: true } });
    if (!capability) throw new HttpError(404, "Capability not found");
    await requireProjectAccess(userId, capability.projectId, "ADVISOR");
    const data = await parseBody(req, body);
    const updated = await prisma.criticalCapability.update({ where: { id }, data });
    await prisma.auditLog.create({ data: { projectId: capability.projectId, actorId: userId, action: "capability.update", target: id, detail: data.status ? `转移状态 → ${data.status}` : "更新负责人" } });
    return { capability: updated };
  });
}
