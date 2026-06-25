import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { created, route, HttpError } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";
import { runAssessment } from "@/services/assessments";
import { createMonthlySnapshot } from "@/services/reporting";
import { ASSESSMENT_KINDS } from "@/domains/assessment";
import { postSlack } from "@/lib/slack";

/** One-click orchestration: run every organizational diagnostic over the evidence,
 *  then roll the results into a fresh monthly report. */
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    const { project } = await requireProjectAccess(userId, id, "ADVISOR");
    const count = await prisma.evidence.count({ where: { projectId: id } });
    if (!count) throw new HttpError(400, "请先添加至少一条证据，再运行完整诊断");
    for (const kind of ASSESSMENT_KINDS) await runAssessment(id, kind, userId);
    const snapshot = await createMonthlySnapshot(id);
    await postSlack(`🔁 ${project.name} 完整诊断完成，已生成月度报告。`);
    await prisma.auditLog.create({ data: { projectId: id, actorId: userId, action: "fulldiagnosis.run", target: id, detail: `运行 ${ASSESSMENT_KINDS.length} 项诊断并生成月度报告` } });
    return created({ ran: ASSESSMENT_KINDS, snapshotId: snapshot.id });
  });
}
