import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { created, route, HttpError } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";
import { deckFromSnapshot } from "@/lib/deck/from-snapshot";

/** Materialise a monthly report as an editable Deck in the PPT 工坊. */
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    const snapshot = await prisma.monthlySnapshot.findUnique({ where: { id }, include: { project: { select: { id: true, name: true, workspaceId: true } } } });
    if (!snapshot) throw new HttpError(404, "Report not found");
    await requireProjectAccess(userId, snapshot.projectId, "MEMBER");
    const deck = deckFromSnapshot(snapshot, snapshot.project.name);
    const row = await prisma.deck.create({
      data: {
        workspaceId: snapshot.project.workspaceId, projectId: snapshot.project.id,
        title: deck.title, scenario: deck.scenario, themeId: deck.themeId,
        slides: deck.slides as object, createdById: userId,
      },
    });
    return created({ deckId: row.id });
  });
}
