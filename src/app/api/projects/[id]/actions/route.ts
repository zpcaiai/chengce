import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { created, parseBody, route, HttpError } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId(); const { id: projectId } = await params;
    await requireProjectAccess(userId, projectId, "MEMBER");
    const body = await parseBody(req, z.object({ title: z.string().min(3).max(160), description: z.string().max(1000).default(""), ownerName: z.string().max(80).default(""), dueAt: z.string().datetime().optional(), capabilityId: z.string().cuid().optional(), assetId: z.string().cuid().optional() }));
    if (body.capabilityId) {
      const capability = await prisma.criticalCapability.findFirst({ where: { id: body.capabilityId, projectId }, select: { id: true } });
      if (!capability) throw new HttpError(400, "Capability does not belong to this project");
    }
    if (body.assetId) {
      const asset = await prisma.systemAsset.findFirst({ where: { id: body.assetId, projectId }, select: { id: true } });
      if (!asset) throw new HttpError(400, "Asset does not belong to this project");
    }
    const action = await prisma.transferAction.create({ data: { ...body, projectId, dueAt: body.dueAt ? new Date(body.dueAt) : null } });
    await prisma.auditLog.create({ data: { projectId, actorId: userId, action: "action.created", target: action.id, detail: action.title } });
    return created({ action });
  });
}
