import { getUserId } from "@/lib/auth";
import { created, route } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";
import { createMonthlySnapshot } from "@/services/reporting";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => { const userId = await getUserId(); const { id } = await params; await requireProjectAccess(userId, id, "ADVISOR"); return created({ snapshot: await createMonthlySnapshot(id) }); });
}
