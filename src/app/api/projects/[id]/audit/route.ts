import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { route } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    await requireProjectAccess(userId, id);
    const logs = await prisma.auditLog.findMany({ where: { projectId: id }, orderBy: { createdAt: "desc" }, take: 50 });
    const actorIds = [...new Set(logs.map((l) => l.actorId))];
    const users = await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true, email: true } });
    const nameById = new Map(users.map((u) => [u.id, u.name || u.email]));
    return {
      logs: logs.map((l) => ({ id: l.id, action: l.action, detail: l.detail, createdAt: l.createdAt, actor: nameById.get(l.actorId) ?? "未知用户" })),
    };
  });
}
