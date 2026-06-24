import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { created, parseBody, route } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId(); const { id } = await params;
    await requireProjectAccess(userId, id);
    return { reviews: await prisma.weeklyReview.findMany({ where: { projectId: id }, orderBy: { weekOf: "desc" }, take: 12 }) };
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId(); const { id } = await params;
    await requireProjectAccess(userId, id, "MEMBER");
    const body = await parseBody(req, z.object({ outcome: z.string().min(5).max(2000), evidence: z.string().max(2000).default(""), risk: z.string().max(1000).default(""), nextFocus: z.string().min(3).max(1000), weekOf: z.string().datetime().optional() }));
    const review = await prisma.weeklyReview.create({ data: { projectId: id, createdById: userId, outcome: body.outcome, evidence: body.evidence, risk: body.risk, nextFocus: body.nextFocus, weekOf: body.weekOf ? new Date(body.weekOf) : new Date() } });
    await prisma.auditLog.create({ data: { projectId: id, actorId: userId, action: "weekly_review.created", target: review.id, detail: review.nextFocus } });
    return created({ review });
  });
}
