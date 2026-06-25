import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { route, HttpError } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";
import { deckFromSnapshot } from "@/lib/deck/from-snapshot";
import { renderDeckPptx } from "@/lib/deck/render-pptx";

// Report export now reuses the Deck rendering pipeline (themes + layouts) instead of
// a second, bespoke pptxgenjs implementation.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    const snapshot = await prisma.monthlySnapshot.findUnique({ where: { id }, include: { project: true } });
    if (!snapshot) throw new HttpError(404, "Report not found");
    await requireProjectAccess(userId, snapshot.projectId);
    const deck = deckFromSnapshot(snapshot, snapshot.project.name);
    const buf = await renderDeckPptx(deck);
    return new Response(new Uint8Array(buf), {
      headers: { "content-type": "application/vnd.openxmlformats-officedocument.presentationml.presentation", "content-disposition": `attachment; filename="chengce-report-${id}.pptx"` },
    });
  });
}
