import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { created, route, parseBody, HttpError } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";
import { runAssessment } from "@/services/assessments";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    await requireProjectAccess(userId, id);
    const assessments = await prisma.assessment.findMany({ where: { projectId: id }, orderBy: { createdAt: "desc" } });
    return { assessments };
  });
}

const body = z.object({
  kind: z.enum(["STRESS_TEST", "LEVERAGE", "ORG_HEALTH", "DECISION_GOVERNANCE", "COLLABORATION"]),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    await requireProjectAccess(userId, id, "ADVISOR");
    const { kind } = await parseBody(req, body);
    const count = await prisma.evidence.count({ where: { projectId: id } });
    if (!count) throw new HttpError(400, "请先添加至少一条访谈、文档或笔记，再运行诊断");
    const assessment = await runAssessment(id, kind, userId);
    return created({ assessment });
  });
}
