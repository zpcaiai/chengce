import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { created, parseBody, route, HttpError } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => { const userId = await getUserId(); const { id } = await params; const asset = await prisma.systemAsset.findUnique({ where: { id } }); if (!asset) throw new HttpError(404, "Asset not found"); await requireProjectAccess(userId, asset.projectId, "MEMBER"); const body = await parseBody(req, z.object({ kind: z.enum(["USED", "REVISION_REQUESTED", "CASE_ADDED"]), note: z.string().max(2000).default("") })); const feedback = await prisma.playbookFeedback.create({ data: { assetId: id, authorId: userId, ...body } }); await prisma.auditLog.create({ data: { projectId: asset.projectId, actorId: userId, action: `asset.${body.kind.toLowerCase()}`, target: id, detail: body.note } }); return created({ feedback }); });
}
