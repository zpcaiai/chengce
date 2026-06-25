import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { route, HttpError } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";
import { reportPdf } from "@/lib/pdf";

const pct = (n: number) => `${Math.round(n * 100)}%`;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    const snapshot = await prisma.monthlySnapshot.findUnique({ where: { id }, include: { project: true } });
    if (!snapshot) throw new HttpError(404, "Report not found");
    await requireProjectAccess(userId, snapshot.projectId);
    const series = await prisma.monthlySnapshot.findMany({ where: { projectId: snapshot.projectId }, orderBy: { createdAt: "asc" }, take: 24, select: { replicationReadiness: true, founderDependency: true } });
    const chart = series.length >= 2 ? { caption: `可复制度与创始人依赖 · 近 ${series.length} 期`, series: [{ label: "可复制度", color: "#10b981", values: series.map((sp) => sp.replicationReadiness) }, { label: "创始人依赖", color: "#f59e0b", values: series.map((sp) => sp.founderDependency) }] } : undefined;
    const radar = [
      { label: "可复制度", value: snapshot.replicationReadiness },
      { label: "创始人独立", value: 1 - snapshot.founderDependency },
      { label: "抗脆弱", value: snapshot.resilience },
      { label: "知识覆盖", value: snapshot.knowledgeCoverage },
      { label: "决策一致", value: snapshot.decisionConsistency },
      { label: "手册落地", value: snapshot.playbookAdoption },
    ];
    const lines = [
      snapshot.summary,
      "",
      "本月前三项最重要动作：",
      ...snapshot.priorities.map((priority, index) => `${index + 1}. ${priority}`),
      "",
      `可复制度：${pct(snapshot.replicationReadiness)}`,
      `创始人依赖：${pct(snapshot.founderDependency)}`,
      `抗脆弱韧性：${pct(snapshot.resilience)}`,
      `知识覆盖：${pct(snapshot.knowledgeCoverage)}`,
      `决策一致性：${pct(snapshot.decisionConsistency)}`,
      `手册落地：${pct(snapshot.playbookAdoption)}`,
      `管理杠杆综合：${pct(snapshot.globalManagement)}`,
      `未关闭高风险能力：${snapshot.openRiskCount} 项`,
    ];
    const pdf = await reportPdf(`${snapshot.project.name} · 月度创始人可复制报告`, lines, chart, radar);
    return new Response(new Uint8Array(pdf), {
      headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="chengce-report-${id}.pdf"` },
    });
  });
}
