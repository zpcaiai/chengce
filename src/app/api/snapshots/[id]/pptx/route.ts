import PptxGenJS from "pptxgenjs";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { route, HttpError } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";

const pct = (n: number) => Math.round(n * 100);

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    const snapshot = await prisma.monthlySnapshot.findUnique({ where: { id }, include: { project: true } });
    if (!snapshot) throw new HttpError(404, "Report not found");
    await requireProjectAccess(userId, snapshot.projectId);

    const pptx = new PptxGenJS();
    pptx.defineLayout({ name: "REPORT", width: 10, height: 5.63 });
    pptx.layout = "REPORT";
    const slide = pptx.addSlide();
    slide.background = { color: "0B1220" };
    slide.addText(`${snapshot.project.name} · 月度创始人可复制报告`, { x: 0.5, y: 0.35, w: 9, h: 0.7, fontSize: 22, color: "E2E8F0", bold: true });
    slide.addText(snapshot.summary, { x: 0.5, y: 1.15, w: 9, h: 0.8, fontSize: 12, color: "94A3B8" });

    const metrics: [string, number][] = [
      ["可复制度", snapshot.replicationReadiness],
      ["创始人依赖", snapshot.founderDependency],
      ["抗脆弱韧性", snapshot.resilience],
      ["知识覆盖", snapshot.knowledgeCoverage],
      ["决策一致性", snapshot.decisionConsistency],
      ["手册落地", snapshot.playbookAdoption],
    ];
    metrics.forEach(([label, value], i) => {
      const col = i % 3, row = Math.floor(i / 3);
      slide.addText(
        [{ text: `${pct(value)}%\n`, options: { fontSize: 26, color: "34D399", bold: true } }, { text: label, options: { fontSize: 11, color: "94A3B8" } }],
        { x: 0.5 + col * 3.05, y: 2.15 + row * 1.25, w: 2.8, h: 1.05, align: "center", valign: "middle", fill: { color: "111827" } },
      );
    });
    if (snapshot.priorities.length) slide.addText(`下月优先：${snapshot.priorities.join("；")}`, { x: 0.5, y: 4.85, w: 9, h: 0.5, fontSize: 11, color: "E2E8F0" });

    const buf = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
    return new Response(new Uint8Array(buf), {
      headers: { "content-type": "application/vnd.openxmlformats-officedocument.presentationml.presentation", "content-disposition": `attachment; filename="chengce-report-${id}.pptx"` },
    });
  });
}
