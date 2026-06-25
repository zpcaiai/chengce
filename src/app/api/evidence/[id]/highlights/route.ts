import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { route, HttpError } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";
import { computeHighlights } from "@/services/highlight-compute";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    const ev = await prisma.evidence.findUnique({ where: { id }, select: { projectId: true, title: true, content: true } });
    if (!ev) throw new HttpError(404, "Evidence not found");
    await requireProjectAccess(userId, ev.projectId, "MEMBER");
    return { highlights: await computeHighlights(ev.title, ev.content) };
  });
}
