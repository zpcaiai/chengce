import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { created, parseBody, route } from "@/lib/http";
import { requireWorkspaceAccess } from "@/lib/permissions";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId(); const { id: workspaceId } = await params;
    await requireWorkspaceAccess(userId, workspaceId, "ADMIN");
    const body = await parseBody(req, z.object({ email: z.string().email(), role: z.enum(["ADMIN", "MEMBER", "ADVISOR", "VIEWER"]).default("MEMBER") }));
    const invite = await prisma.workspaceInvite.create({ data: { workspaceId, email: body.email.toLowerCase(), role: body.role, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
    const existing = await prisma.user.findUnique({ where: { email: invite.email } });
    if (existing) await prisma.membership.upsert({ where: { workspaceId_userId: { workspaceId, userId: existing.id } }, update: { role: invite.role }, create: { workspaceId, userId: existing.id, role: invite.role } });
    const base = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    const joinUrl = `${base}/invite/${invite.token}`;
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { name: true } });
    const email = await sendEmail({
      to: invite.email,
      subject: `邀请你加入「${workspace?.name ?? "工作区"}」`,
      html: `<p>你被邀请加入承策工作区「${workspace?.name ?? ""}」。</p><p><a href="${joinUrl}">点此接受邀请</a></p><p>或复制链接：<br>${joinUrl}</p>`,
      text: `你被邀请加入承策工作区「${workspace?.name ?? ""}」。接受邀请：${joinUrl}`,
    });
    return created({ invite, joinUrl, joinedExistingUser: Boolean(existing), emailed: email.sent });
  });
}
