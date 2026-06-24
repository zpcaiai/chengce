import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { route, HttpError } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";

export async function POST(_: Request, { params }: { params: Promise<{ token: string }> }) {
  return route(async () => { const userId = await getUserId(); const { token } = await params; const share = await prisma.reportShare.findUnique({ where: { token }, include: { snapshot: true } }); if (!share) throw new HttpError(404, "Share not found"); await requireProjectAccess(userId, share.snapshot.projectId, "ADMIN"); return { share: await prisma.reportShare.update({ where: { token }, data: { revokedAt: new Date() } }) }; });
}
