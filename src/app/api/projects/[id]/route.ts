import { getUserId } from "@/lib/auth";
import { parseBody, route } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { z } from "zod";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId(); const { id } = await params;
    const { project } = await requireProjectAccess(userId, id);
    return project;
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId(); const { id } = await params;
    await requireProjectAccess(userId, id, "MEMBER");
    const body = await parseBody(req, z.object({ targetUser: z.string().max(300).optional(), mvpOutcome: z.string().max(600).optional(), successMetric: z.string().max(300).optional() }));
    const project = await prisma.transformationProject.update({ where: { id }, data: body });
    await prisma.auditLog.create({ data: { projectId: id, actorId: userId, action: "project.mvp.updated", target: id, detail: "Updated MVP brief" } });
    return { project };
  });
}
