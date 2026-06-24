import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { created, route, parseBody } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";
import { createDecision } from "@/services/decisions";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    await requireProjectAccess(userId, id);
    const decisions = await prisma.decision.findMany({
      where: { projectId: id },
      include: { reviews: { orderBy: { createdAt: "desc" } } },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
    return { decisions };
  });
}

const body = z.object({
  title: z.string().min(2, "请填写决策标题").max(160),
  context: z.string().max(4000).default(""),
  decision: z.string().max(4000).default(""),
  rationale: z.string().max(4000).default(""),
  ownerName: z.string().max(120).default(""),
  reversibility: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  expectedOutcome: z.string().max(2000).default(""),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    await requireProjectAccess(userId, id, "MEMBER");
    const data = await parseBody(req, body);
    const decision = await createDecision(id, data, userId);
    return created({ decision });
  });
}
