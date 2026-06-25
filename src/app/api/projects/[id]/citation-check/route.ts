import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { route } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";
import { quoteFound } from "@/lib/citations";

/** Flags citations whose quote cannot be found in the cited evidence — a guard against
 *  AI hallucination in the evidence trail. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId();
    const { id } = await params;
    await requireProjectAccess(userId, id);
    const refs = await prisma.evidenceReference.findMany({
      where: { evidence: { projectId: id } },
      select: { id: true, quote: true, evidence: { select: { title: true, content: true } }, capability: { select: { name: true } }, asset: { select: { title: true } } },
    });
    const unverified = refs
      .filter((r) => r.quote && !quoteFound(r.quote, r.evidence.content))
      .map((r) => ({ id: r.id, quote: r.quote, evidenceTitle: r.evidence.title, on: r.capability?.name || r.asset?.title || "—" }));
    return { total: refs.length, unverifiedCount: unverified.length, unverified: unverified.slice(0, 50) };
  });
}
