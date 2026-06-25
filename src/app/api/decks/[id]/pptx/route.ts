import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { route, HttpError } from "@/lib/http";
import { renderDeckPptx } from "@/lib/deck/render-pptx";
import type { Slide } from "@/lib/deck/types";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    const deck = await prisma.deck.findUnique({ where: { id } });
    if (!deck || deck.createdById !== userId) throw new HttpError(404, "Deck not found");
    const buf = await renderDeckPptx({ title: deck.title, themeId: deck.themeId, scenario: deck.scenario, slides: deck.slides as unknown as Slide[] });
    return new Response(new Uint8Array(buf), {
      headers: { "content-type": "application/vnd.openxmlformats-officedocument.presentationml.presentation", "content-disposition": `attachment; filename="${encodeURIComponent(deck.title)}.pptx"` },
    });
  });
}
