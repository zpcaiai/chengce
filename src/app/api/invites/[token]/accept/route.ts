import { prisma } from "@/lib/db";
import { getOptionalUserId } from "@/lib/auth";
import { route, HttpError } from "@/lib/http";

/** A logged-in user accepts a workspace invite by token (idempotent). */
export async function POST(_: Request, { params }: { params: Promise<{ token: string }> }) {
  return route(async () => {
    const userId = await getOptionalUserId();
    if (!userId) throw new HttpError(401, "请先登录后再接受邀请");
    const { token } = await params;
    const invite = await prisma.workspaceInvite.findUnique({ where: { token }, include: { workspace: { select: { id: true, name: true } } } });
    if (!invite || invite.expiresAt < new Date()) throw new HttpError(400, "邀请无效或已过期");
    await prisma.$transaction([
      prisma.membership.upsert({ where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId } }, update: {}, create: { workspaceId: invite.workspaceId, userId, role: invite.role } }),
      prisma.workspaceInvite.update({ where: { id: invite.id }, data: { acceptedAt: invite.acceptedAt ?? new Date() } }),
    ]);
    return { workspaceId: invite.workspaceId, workspaceName: invite.workspace.name };
  });
}
