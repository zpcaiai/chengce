import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { created, parseBody, route } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId(); const { id } = await params;
    await requireProjectAccess(userId, id);
    return { experiments: await prisma.projectExperiment.findMany({ where: { projectId: id }, orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }] }) };
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId(); const { id } = await params;
    await requireProjectAccess(userId, id, "MEMBER");
    const body = await parseBody(req, z.object({ hypothesis: z.string().min(8).max(1000), method: z.string().max(1000).default(""), metric: z.string().max(300).default(""), ownerName: z.string().max(80).default(""), dueAt: z.string().datetime().nullable().optional() }));
    const experiment = await prisma.projectExperiment.create({ data: { projectId: id, ...body, dueAt: body.dueAt ? new Date(body.dueAt) : null } });
    await prisma.auditLog.create({ data: { projectId: id, actorId: userId, action: "experiment.created", target: experiment.id, detail: experiment.hypothesis } });
    return created({ experiment });
  });
}
