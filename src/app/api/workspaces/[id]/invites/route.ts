import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { created, parseBody, route } from "@/lib/http";
import { requireWorkspaceAccess } from "@/lib/permissions";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId(); const { id: workspaceId } = await params;
    await requireWorkspaceAccess(userId, workspaceId, "ADMIN");
    const body = await parseBody(req, z.object({ email: z.string().email(), role: z.enum(["ADMIN", "MEMBER", "ADVISOR", "VIEWER"]).default("MEMBER") }));
    const invite = await prisma.workspaceInvite.create({ data: { workspaceId, email: body.email.toLowerCase(), role: body.role, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
    const existing = await prisma.user.findUnique({ where: { email: invite.email } });
    if (existing) await prisma.membership.upsert({ where: { workspaceId_userId: { workspaceId, userId: existing.id } }, update: { role: invite.role }, create: { workspaceId, userId: existing.id, role: invite.role } });
    const origin = new URL(req.url).origin;
    return created({ invite, joinUrl: `${origin}/login?invite=${invite.token}`, joinedExistingUser: Boolean(existing) });
  });
}
