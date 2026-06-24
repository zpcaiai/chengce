import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { created, route, HttpError } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";

/** Adopt a retrospective's suggested rule as a draft DECISION_RULE asset (decision → rule loop). */
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    const decision = await prisma.decision.findUnique({ where: { id }, include: { reviews: { orderBy: { createdAt: "desc" }, take: 1 } } });
    if (!decision) throw new HttpError(404, "Decision not found");
    await requireProjectAccess(userId, decision.projectId, "ADVISOR");
    const analysis = (decision.reviews[0]?.analysis ?? {}) as { suggestedRule?: string };
    const suggested = analysis.suggestedRule?.trim();
    if (!suggested) throw new HttpError(400, "该决策还没有可采纳的建议规则，请先运行复盘");
    const content = {
      purpose: suggested,
      whenToUse: decision.context || "适用于与该决策相同情境的判断。",
      owner: decision.ownerName || "",
      trigger: "出现与该决策相同类型的判断时。",
      steps: [suggested],
      doneWhen: "按规则做出一致的 go/no-go 决定并留下记录。",
      exceptions: [] as string[],
      examples: [] as string[],
    };
    const asset = await prisma.systemAsset.create({
      data: { projectId: decision.projectId, kind: "DECISION_RULE", title: `决策规则：${decision.title}`, ownerName: decision.ownerName, status: "DRAFT", content: content as Prisma.InputJsonValue },
    });
    await prisma.auditLog.create({ data: { projectId: decision.projectId, actorId: userId, action: "asset.adopted_from_decision", target: asset.id, detail: asset.title } });
    return created({ asset });
  });
}
