import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { parseBody, route, HttpError } from "@/lib/http";
import { requireWorkspaceAccess } from "@/lib/permissions";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { return route(async () => { const userId = await getUserId(); const { id } = await params; await requireWorkspaceAccess(userId, id, "VIEWER"); return prisma.membership.findMany({ where: { workspaceId: id }, include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "asc" } }); }); }
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) { return route(async () => { const userId = await getUserId(); const { id: workspaceId } = await params; await requireWorkspaceAccess(userId, workspaceId, "OWNER"); const body = await parseBody(req, z.object({ userId: z.string().cuid(), role: z.enum(["ADMIN", "MEMBER", "ADVISOR", "VIEWER"]) })); return { membership: await prisma.membership.update({ where: { workspaceId_userId: { workspaceId, userId: body.userId } }, data: { role: body.role } }) }; }); }
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) { return route(async () => { const actor = await getUserId(); const { id: workspaceId } = await params; await requireWorkspaceAccess(actor, workspaceId, "OWNER"); const target = new URL(req.url).searchParams.get("userId"); if (!target) throw new HttpError(400, "userId is required"); if (target === actor) throw new HttpError(400, "Workspace owner cannot remove themselves"); await prisma.membership.delete({ where: { workspaceId_userId: { workspaceId, userId: target } } }); return { ok: true }; }); }
