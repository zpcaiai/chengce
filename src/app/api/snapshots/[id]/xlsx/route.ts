import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { route, HttpError } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";

const pctStr = (n: number) => `${Math.round(n * 100)}%`;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    const snapshot = await prisma.monthlySnapshot.findUnique({ where: { id }, include: { project: true } });
    if (!snapshot) throw new HttpError(404, "Report not found");
    await requireProjectAccess(userId, snapshot.projectId);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("月度报告");
    ws.columns = [{ width: 24 }, { width: 60 }];
    ws.addRow([`${snapshot.project.name} · 月度创始人可复制报告`]);
    ws.addRow([snapshot.summary]);
    ws.addRow([]);
    ws.addRow(["指标", "数值"]);
    const metrics: [string, number][] = [
      ["可复制度", snapshot.replicationReadiness],
      ["创始人依赖", snapshot.founderDependency],
      ["抗脆弱韧性", snapshot.resilience],
      ["知识覆盖", snapshot.knowledgeCoverage],
      ["决策一致性", snapshot.decisionConsistency],
      ["手册落地", snapshot.playbookAdoption],
      ["管理杠杆综合", snapshot.globalManagement],
    ];
    for (const [label, value] of metrics) ws.addRow([label, pctStr(value)]);
    ws.addRow(["未关闭高风险能力", snapshot.openRiskCount]);
    ws.addRow([]);
    ws.addRow(["下月优先事项"]);
    snapshot.priorities.forEach((p, i) => ws.addRow([`${i + 1}.`, p]));

    const buf = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
    return new Response(new Uint8Array(buf), {
      headers: { "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "content-disposition": `attachment; filename="chengce-report-${id}.xlsx"` },
    });
  });
}
