import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { created, parseBody, route } from "@/lib/http";
import { requireProjectAccess } from "@/lib/permissions";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const userId = await getUserId(); const { id: projectId } = await params;
    await requireProjectAccess(userId, projectId, "MEMBER");
    const body = await parseBody(req, z.object({ kind: z.enum(["INTERVIEW", "DOCUMENT", "NOTE"]), title: z.string().min(2).max(160), sourceName: z.string().max(160).default(""), content: z.string().min(20).max(80_000) }));
    const evidence = await prisma.evidence.create({ data: { ...body, projectId, authorId: userId } });
    await prisma.auditLog.create({ data: { projectId, actorId: userId, action: "evidence.created", target: evidence.id, detail: evidence.title } });
    return created({ evidence });
  });
}
