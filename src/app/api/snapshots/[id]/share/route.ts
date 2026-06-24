import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { created, parseBody, route, HttpError } from "@/lib/http";
import { z } from "zod";
import { requireProjectAccess } from "@/lib/permissions";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId(); const { id } = await params; const body = await parseBody(req, z.object({ expiresInDays: z.number().int().min(1).max(365).optional() }));
    const snapshot = await prisma.monthlySnapshot.findUnique({ where: { id } });
    if (!snapshot) throw new HttpError(404, "Report not found");
    await requireProjectAccess(userId, snapshot.projectId, "ADMIN");
    const share = await prisma.reportShare.create({ data: { snapshotId: id, createdById: userId, expiresAt: body.expiresInDays ? new Date(Date.now() + body.expiresInDays * 864e5) : null } });
    return created({ share, url: `${new URL(req.url).origin}/share/${share.token}` });
  });
}
