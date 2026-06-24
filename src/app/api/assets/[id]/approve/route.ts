import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { route, HttpError } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId(); const { id } = await params;
    const asset = await prisma.systemAsset.findUnique({ where: { id } });
    if (!asset) throw new HttpError(404, "Asset not found");
    await requireProjectAccess(userId, asset.projectId, "ADMIN");
    const approved = await prisma.systemAsset.update({ where: { id }, data: { status: "APPROVED", approvedAt: new Date(), approvedById: userId } });
    await prisma.auditLog.create({ data: { projectId: asset.projectId, actorId: userId, action: "asset.approved", target: id, detail: asset.title } });
    return { asset: approved };
  });
}
