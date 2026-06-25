import { z } from "zod";
import type { CommentTarget } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { created, route, parseBody, HttpError } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    await requireProjectAccess(userId, id);
    const url = new URL(req.url);
    const targetType = url.searchParams.get("targetType");
    const targetId = url.searchParams.get("targetId");
    if (!targetType || !targetId) throw new HttpError(400, "缺少 targetType / targetId");
    const comments = await prisma.comment.findMany({ where: { projectId: id, targetType: targetType as CommentTarget, targetId }, orderBy: { createdAt: "asc" }, take: 100 });
    const authorIds = [...new Set(comments.map((c) => c.authorId))];
    const users = await prisma.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, name: true, email: true } });
    const nameById = new Map(users.map((u) => [u.id, u.name || u.email]));
    return { comments: comments.map((c) => ({ id: c.id, body: c.body, createdAt: c.createdAt, author: nameById.get(c.authorId) ?? "未知用户" })) };
  });
}

const bodySchema = z.object({ targetType: z.enum(["CAPABILITY", "ASSET", "DECISION"]), targetId: z.string().min(1), body: z.string().min(1).max(4000) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    const { project } = await requireProjectAccess(userId, id, "MEMBER");
    const data = await parseBody(req, bodySchema);
    const comment = await prisma.comment.create({ data: { projectId: id, targetType: data.targetType, targetId: data.targetId, authorId: userId, body: data.body } });

    // @mentions → MENTION notifications for matched workspace members.
    const tokens = [...new Set((data.body.match(/@([\p{L}\w._-]{1,40})/gu) || []).map((t) => t.slice(1).toLowerCase()))];
    if (tokens.length) {
      const members = await prisma.membership.findMany({ where: { workspaceId: project.workspaceId }, include: { user: { select: { id: true, name: true, email: true } } } });
      for (const m of members) {
        if (m.userId === userId) continue;
        const name = (m.user.name || "").toLowerCase();
        const emailLocal = m.user.email.split("@")[0].toLowerCase();
        if (tokens.some((t) => t === name || t === emailLocal || t === m.user.email.toLowerCase())) {
          await prisma.notification.create({ data: { userId: m.userId, kind: "MENTION", title: "有人在评论中提到了你", body: data.body.slice(0, 120), link: `/projects/${id}`, dedupeKey: `mention:${comment.id}:${m.userId}`, workspaceId: project.workspaceId, projectId: id } });
        }
      }
    }
    await prisma.auditLog.create({ data: { projectId: id, actorId: userId, action: "comment.created", target: data.targetId, detail: data.body.slice(0, 120) } });
    return created({ comment });
  });
}
