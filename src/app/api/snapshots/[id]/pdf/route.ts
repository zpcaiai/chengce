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
    const pdf = await reportPdf(`${snapshot.project.name} · 月度创始人可复制报告`, lines);
    return new Response(new Uint8Array(pdf), {
      headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="chengce-report-${id}.pdf"` },
    });
  });
}
