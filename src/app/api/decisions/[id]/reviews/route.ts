import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { created, route, parseBody, HttpError } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";
import { runRetrospective } from "@/services/decisions";
import { postSlack } from "@/lib/slack";

const body = z.object({ outcome: z.string().max(4000).default(""), reviewerName: z.string().max(120).default("") });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    const decision = await prisma.decision.findUnique({ where: { id }, select: { projectId: true, title: true } });
    if (!decision) throw new HttpError(404, "Decision not found");
    await requireProjectAccess(userId, decision.projectId, "ADVISOR");
    const { outcome, reviewerName } = await parseBody(req, body);
    const review = await runRetrospective(id, outcome, reviewerName, userId);
    await postSlack(`🧭 决策「${decision.title}」完成团队复盘。`);
    return created({ review });
  });
}
