import { z } from "zod";
import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { parseBody, route, HttpError } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId(); const { id } = await params; const asset = await prisma.systemAsset.findUnique({ where: { id } });
    if (!asset) throw new HttpError(404, "Asset not found"); await requireProjectAccess(userId, asset.projectId, "ADVISOR");
    const body = await parseBody(req, z.object({ title: z.string().min(3).max(160).optional(), ownerName: z.string().max(80).optional(), reviewAt: z.string().datetime().nullable().optional(), content: z.record(z.unknown()).optional(), changeNote: z.string().max(500).default("") }));
    const nextVersion = asset.version + 1; const content = (body.content ?? asset.content) as Prisma.InputJsonValue;
    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.systemAsset.update({ where: { id }, data: { title: body.title ?? asset.title, ownerName: body.ownerName ?? asset.ownerName, reviewAt: body.reviewAt === undefined ? asset.reviewAt : body.reviewAt ? new Date(body.reviewAt) : null, content, version: nextVersion, status: "DRAFT", approvedAt: null, approvedById: null } });
      await tx.systemAssetRevision.create({ data: { assetId: id, version: nextVersion, title: next.title, content, changeNote: body.changeNote, createdById: userId } });
      await tx.auditLog.create({ data: { projectId: asset.projectId, actorId: userId, action: "asset.revised", target: id, detail: body.changeNote } });
      return next;
    });
    return { asset: updated };
  });
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    const asset = await prisma.systemAsset.findUnique({ where: { id }, select: { projectId: true } });
    if (!asset) throw new HttpError(404, "Asset not found");
    await requireProjectAccess(userId, asset.projectId);
    const [revisions, approvals, feedback] = await Promise.all([
      prisma.systemAssetRevision.findMany({ where: { assetId: id }, orderBy: { version: "desc" }, select: { id: true, version: true, changeNote: true, createdAt: true, content: true } }),
      prisma.assetApproval.findMany({ where: { assetId: id }, orderBy: { createdAt: "desc" }, select: { id: true, decision: true, note: true, createdAt: true } }),
      prisma.playbookFeedback.findMany({ where: { assetId: id }, orderBy: { createdAt: "desc" }, select: { id: true, kind: true, note: true, createdAt: true } }),
    ]);
    return { revisions, approvals, feedback };
  });
}
