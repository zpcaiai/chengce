import { getUserId } from "@/lib/auth";
import { created, route } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";
import { createMonthlySnapshot } from "@/services/reporting";
import { postSlack } from "@/lib/slack";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => { const userId = await getUserId(); const { id } = await params; const { project } = await requireProjectAccess(userId, id, "ADVISOR"); const snapshot = await createMonthlySnapshot(id); await postSlack(`📊 ${project.name} 月度报告：可复制度 ${Math.round(snapshot.replicationReadiness * 100)}%，创始人依赖 ${Math.round(snapshot.founderDependency * 100)}%`); return created({ snapshot }); });
}
